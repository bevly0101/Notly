"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { localStore } from "@/lib/db/local-store";
import type { Workspace, Page, Block } from "@/lib/types";
import type { BlockDoc } from "@/lib/types";

interface SyncPullResult {
  workspaces: Record<string, unknown>[];
  pages: Record<string, unknown>[];
  blocks: Record<string, unknown>[];
  deleted: { table_name: string; record_id: string }[];
}

function mapWorkspace(row: Record<string, unknown>): Workspace {
  const mode =
    (row.mode as string) ||
    ((row.metadata as Record<string, unknown>)?.mode as string) ||
    "sync";
  return {
    id: row.id as string,
    name: row.name as string,
    mode: mode === "local" ? "local" : "sync",
    icon: (row.icon as string) ?? "📁",
    lastEdited: (row.updated_at as string) ?? new Date().toISOString(),
    status: "synced",
    userId: (row.user_id as string) ?? null,
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

function mapPage(row: Record<string, unknown>): Page {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    parentId: (row.parent_id as string) ?? null,
    title: row.title as string,
    icon: (row.icon as string) ?? "📄",
    coverImage: (row.cover_image as string) ?? null,
    isFavorite: Boolean(row.is_favorite),
    sortOrder: (row.sort_order as number) ?? 0,
    path: row.path ? String(row.path) : null,
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

function mapBlock(row: Record<string, unknown>): BlockDoc {
  const content = row.content as Record<string, unknown> | null;
  const attrs = row.attrs as Record<string, unknown> | null;
  return {
    id: row.id as string,
    pageId: row.page_id as string,
    type: row.type as string,
    contentJson: JSON.stringify(content ?? {}),
    attrsJson: attrs ? JSON.stringify(attrs) : undefined,
    parentId: (row.parent_id as string) ?? undefined,
    sortOrder: (row.sort_order as number) ?? 0,
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

export class SyncService {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  async pull(): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const since = localStore.getSyncMeta().lastSync;

    const { data, error } = await supabase.rpc("sync_pull", {
      p_since: since,
    });

    if (error) {
      console.error("sync_pull error:", error.message);
      return;
    }

    const result = data as SyncPullResult;

    for (const row of result.workspaces ?? []) {
      localStore.upsertWorkspace(mapWorkspace(row));
    }

    for (const row of result.pages ?? []) {
      localStore.upsertPage(mapPage(row));
    }

    for (const row of result.blocks ?? []) {
      localStore.upsertBlock(mapBlock(row));
    }

    for (const del of result.deleted ?? []) {
      if (del.table_name === "workspaces") {
        localStore.removeWorkspace(del.record_id);
      } else if (del.table_name === "blocks") {
        localStore.removeBlock(del.record_id);
      }
    }

    localStore.setSyncMeta(new Date().toISOString());

    for (const ws of localStore.getWorkspaces()) {
      if (ws.mode === "sync" && ws.status === "syncing") {
        localStore.upsertWorkspace({ ...ws, status: "synced" });
      }
    }
  }

  async pushWorkspace(workspace: Workspace): Promise<void> {
    if (workspace.mode !== "sync" || !isSupabaseConfigured()) return;

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.rpc("workspace_create", {
      p_id: workspace.id,
      p_name: workspace.name,
      p_icon: workspace.icon,
      p_metadata: { mode: workspace.mode },
    });
  }

  async pushPage(page: Page): Promise<void> {
    const ws = localStore.getWorkspace(page.workspaceId);
    if (!ws || ws.mode !== "sync" || !isSupabaseConfigured()) return;

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.rpc("page_create", {
      p_id: page.id,
      p_workspace_id: page.workspaceId,
      p_parent_id: page.parentId,
      p_title: page.title,
      p_icon: page.icon,
      p_sort_order: page.sortOrder,
      p_metadata: { is_favorite: page.isFavorite, cover_image: page.coverImage },
    });
  }

  async pushBlock(block: Block): Promise<void> {
    const page = localStore.getPage(block.pageId);
    if (!page) return;
    const ws = localStore.getWorkspace(page.workspaceId);
    if (!ws || ws.mode !== "sync" || !isSupabaseConfigured()) return;

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.rpc("block_create", {
      p_id: block.id,
      p_page_id: block.pageId,
      p_type: block.type,
      p_content: block.content,
      p_attrs: block.attrs,
      p_sort_order: block.sortOrder,
    });
  }

  async markSyncing(workspaceId: string): Promise<void> {
    const ws = localStore.getWorkspace(workspaceId);
    if (ws && ws.mode === "sync") {
      localStore.upsertWorkspace({ ...ws, status: "syncing" });
    }
  }

  startPolling(intervalMs = 30000): void {
    if (this.intervalId) return;
    this.pull();
    this.intervalId = setInterval(() => this.pull(), intervalMs);
  }

  stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const syncService = new SyncService();
