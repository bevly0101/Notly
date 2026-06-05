import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotlyDatabase } from "@/lib/db/database";
import type { SyncCollection } from "./types";

const LS_LAST_SYNC = "notly_last_sync_at";

function getLastSyncTimestamp(): number {
  try {
    const val = localStorage.getItem(LS_LAST_SYNC);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

function setLastSyncTimestamp(ts: number) {
  try {
    localStorage.setItem(LS_LAST_SYNC, String(ts));
  } catch {}
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function mapCloudDoc(table: string, doc: Record<string, unknown>): Record<string, unknown> {
  let isOnline = false;
  const meta = doc.metadata as Record<string, unknown> | undefined;
  if (meta && typeof meta.is_online === "boolean") {
    isOnline = meta.is_online;
  }

  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc)) {
    if (key === "user_id" || key === "deleted_at" || key === "path" || key === "metadata") continue;
    const camel = snakeToCamel(key);
    mapped[camel] = value;
  }

  if (table === "workspaces") {
    mapped.isOnline = isOnline;
  }

  if (mapped.createdAt) mapped.createdAt = new Date(mapped.createdAt as string).getTime();
  if (mapped.updatedAt) mapped.updatedAt = new Date(mapped.updatedAt as string).getTime();
  return mapped;
}

function getRxCollectionName(table: string): SyncCollection | null {
  if (table === "workspaces") return "workspaces";
  if (table === "pages") return "pages";
  if (table === "blocks") return "blocks";
  return null;
}

type SyncPullResult = {
  workspaces: Record<string, unknown>[];
  pages: Record<string, unknown>[];
  blocks: Record<string, unknown>[];
  deleted: { table_name: string; record_id: string }[];
};

async function getOnlineWorkspaceIds(db: NotlyDatabase): Promise<Set<string>> {
  const online = new Set<string>();
  try {
    const all = await db.workspaces.find().exec();
    for (const ws of all) {
      if (ws.isOnline) online.add(ws.id);
    }
  } catch {
    /* ignore */
  }
  return online;
}

export async function pullChanges(
  supabase: SupabaseClient,
  db: NotlyDatabase,
): Promise<number> {
  const lastSync = getLastSyncTimestamp();
  const since = lastSync > 0 ? new Date(lastSync).toISOString() : "1970-01-01T00:00:00Z";

  const { data, error } = await supabase.rpc("sync_pull", {
    p_since: since,
  });

  if (error) {
    console.error("[Sync] Pull error:", error.message);
    return 0;
  }

  const result = data as unknown as SyncPullResult;
  if (!result) return 0;

  const onlineWorkspaces = await getOnlineWorkspaceIds(db);

  // Build pageId → workspaceId map from local data + incoming cloud pages
  const pageWsMap = new Map<string, string>();
  try {
    const allPages = await db.pages.find().exec();
    for (const p of allPages) {
      pageWsMap.set(p.id, p.workspaceId);
    }
    // Also add cloud pages that will be processed in this pull cycle
    if (result.pages) {
      for (const cp of result.pages) {
        pageWsMap.set(cp.id as string, cp.workspace_id as string);
      }
    }
  } catch {
    /* ignore */
  }

  let processed = 0;

  // Process active documents
  for (const [table, docs] of Object.entries(result) as [string, Record<string, unknown>[]][]) {
    if (table === "deleted") continue;

    const collectionName = getRxCollectionName(table);
    if (!collectionName) continue;

    const collection = db[collectionName];
    if (!collection) continue;

    for (const cloudDoc of docs) {
      try {
        // Filter by workspace online status
        if (table === "pages") {
          const wsId = cloudDoc.workspace_id as string;
          if (!wsId || !onlineWorkspaces.has(wsId)) continue;
        }
        if (table === "blocks") {
          const pageId = cloudDoc.page_id as string;
          const wsId = pageWsMap.get(pageId);
          if (!wsId || !onlineWorkspaces.has(wsId)) {
            // If the page is also being pulled, look up its workspace_id from the cloud pages
            const cloudPage = result.pages?.find((p) => p.id === pageId);
            const resolvedWs = cloudPage ? (cloudPage.workspace_id as string) : undefined;
            if (!resolvedWs || !onlineWorkspaces.has(resolvedWs)) continue;
            pageWsMap.set(pageId, resolvedWs);
          }
        }

        const rid = cloudDoc.id as string;
        const existing = await collection.findOne(rid).exec();

        if (existing) {
          const cloudUpdated = cloudDoc.updated_at
            ? new Date(cloudDoc.updated_at as string).getTime()
            : 0;
          const localUpdated = (existing as unknown as { updatedAt: number }).updatedAt ?? 0;

          if (cloudUpdated <= localUpdated) continue;

          const patch = mapCloudDoc(table, cloudDoc);
          delete patch.id;
          await existing.patch(patch);
        } else {
          const doc = mapCloudDoc(table, cloudDoc);
          doc.id = rid;
          await collection.insert(doc as never);
        }

        processed++;
      } catch (err) {
        console.error(`[Sync] Pull error processing ${table}/${cloudDoc.id}:`, err);
      }
    }
  }

  // Process deletions (soft delete na cloud)
  if (result.deleted) {
    for (const del of result.deleted) {
      try {
        const collectionName = getRxCollectionName(del.table_name);
        if (!collectionName) continue;

        const collection = db[collectionName];
        if (!collection) continue;

        const existing = await collection.findOne(del.record_id).exec();
        if (existing) {
          await existing.remove();
          processed++;
        }
      } catch (err) {
        console.error(`[Sync] Pull error processing deletion ${del.table_name}/${del.record_id}:`, err);
      }
    }
  }

  if (processed > 0) {
    setLastSyncTimestamp(Date.now());
  }

  return processed;
}
