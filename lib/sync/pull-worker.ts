import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotlyDatabase } from "@/lib/db/database";
import type { SyncLogEntry, SyncCollection } from "./types";

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

function mapSnapshotToRxDB(table: string, snapshot: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(snapshot)) {
    if (key === "user_id" || key === "deleted_at" || key === "path") continue;
    const camel = snakeToCamel(key);
    mapped[camel] = value;
  }
  if (mapped.createdAt) mapped.createdAt = new Date(mapped.createdAt as string).getTime();
  if (mapped.updatedAt) mapped.updatedAt = new Date(mapped.updatedAt as string).getTime();
  return mapped;
}

function getRxCollectionName(table: string): SyncCollection | null {
  const map: Record<string, SyncCollection> = {
    workspaces: "workspaces",
    pages: "pages",
    blocks: "blocks",
  };
  return map[table] ?? null;
}

export async function pullChanges(
  supabase: SupabaseClient,
  db: NotlyDatabase,
): Promise<number> {
  const lastSync = getLastSyncTimestamp();
  const since = lastSync > 0 ? new Date(lastSync).toISOString() : "1970-01-01T00:00:00Z";

  const { data, error } = await supabase
    .from("sync_log")
    .select("*")
    .gt("created_at", since)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[Sync] Pull error:", error.message);
    return 0;
  }

  const entries = data as SyncLogEntry[];
  if (entries.length === 0) return 0;

  let processed = 0;

  for (const entry of entries) {
    const collectionName = getRxCollectionName(entry.table_name);
    if (!collectionName) continue;

    const collection = db[collectionName];
    if (!collection) continue;

    try {
      const existing = await collection.findOne(entry.record_id).exec();

      switch (entry.action) {
        case "create": {
          if (existing) break;
          const doc = mapSnapshotToRxDB(entry.table_name, entry.snapshot);
          doc.id = entry.record_id;
          await collection.insert(doc as never);
          break;
        }

        case "update": {
          if (!existing) {
            const doc = mapSnapshotToRxDB(entry.table_name, entry.snapshot);
            doc.id = entry.record_id;
            await collection.insert(doc as never);
            break;
          }
          const snapshotUpdatedAt = entry.snapshot.updated_at
            ? new Date(entry.snapshot.updated_at as string).getTime()
            : 0;
          const localUpdatedAt = (existing as unknown as Record<string, unknown>).updatedAt as number || 0;
          if (snapshotUpdatedAt > localUpdatedAt) {
            const patch = mapSnapshotToRxDB(entry.table_name, entry.snapshot);
            delete patch.id;
            await existing.patch(patch);
          }
          break;
        }

        case "soft_delete": {
          if (existing) {
            await existing.remove();
          }
          break;
        }

        case "restore": {
          if (existing) break;
          const doc = mapSnapshotToRxDB(entry.table_name, entry.snapshot);
          doc.id = entry.record_id;
          await collection.insert(doc as never);
          break;
        }
      }

      processed++;
    } catch (err) {
      console.error(`[Sync] Pull error processing ${entry.table_name}/${entry.record_id}:`, err);
    }
  }

  const latestTs = entries[entries.length - 1].created_at;
  setLastSyncTimestamp(new Date(latestTs).getTime());

  return processed;
}
