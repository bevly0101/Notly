"use client";

import { v4 as uuidv4 } from "uuid";
import { localStore } from "@/lib/db/local-store";
import { syncService } from "@/lib/sync/sync-service";
import {
  type Workspace,
  type Page,
  type Block,
  type WorkspaceMode,
  blockToDoc,
  docToBlock,
} from "@/lib/types";

const now = () => new Date().toISOString();

export const dataService = {
  async getWorkspaces(): Promise<Workspace[]> {
    return localStore.getWorkspaces().sort(
      (a, b) => new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime()
    );
  },

  async createWorkspace(
    name: string,
    mode: WorkspaceMode,
    icon: string | null = null
  ): Promise<Workspace> {
    const workspace: Workspace = {
      id: uuidv4(),
      name,
      mode,
      icon: icon ?? "📁",
      lastEdited: now(),
      status: mode === "sync" ? "syncing" : "offline",
      updatedAt: now(),
    };
    localStore.upsertWorkspace(workspace);

    if (mode === "sync") {
      await syncService.pushWorkspace(workspace);
      await syncService.pull();
      workspace.status = "synced";
      localStore.upsertWorkspace(workspace);
    }

    return workspace;
  },

  async updateWorkspace(
    id: string,
    patch: Partial<Pick<Workspace, "name" | "icon" | "status">>
  ): Promise<void> {
    const existing = localStore.getWorkspace(id);
    if (!existing) return;

    const workspace = {
      ...existing,
      ...patch,
      lastEdited: now(),
      updatedAt: now(),
    };
    localStore.upsertWorkspace(workspace);

    if (workspace.mode === "sync") {
      await syncService.markSyncing(id);
      await syncService.pushWorkspace(workspace);
      await syncService.pull();
    }
  },

  async deleteWorkspace(id: string): Promise<void> {
    const ws = localStore.getWorkspace(id);
    if (!ws) return;

    if (ws.mode === "sync") {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.rpc("workspace_delete", { p_id: id });
    }

    localStore.removeWorkspace(id);
  },

  async getPages(workspaceId: string): Promise<Page[]> {
    return localStore.getPages(workspaceId);
  },

  async getPage(id: string): Promise<Page | null> {
    return localStore.getPage(id) ?? null;
  },

  async createPage(
    workspaceId: string,
    title = "Sem título",
    parentId: string | null = null
  ): Promise<Page> {
    const pages = await this.getPages(workspaceId);
    const page: Page = {
      id: uuidv4(),
      workspaceId,
      parentId,
      title,
      icon: "📄",
      coverImage: null,
      isFavorite: false,
      sortOrder: pages.length,
      path: null,
      updatedAt: now(),
    };
    localStore.upsertPage(page);

    const defaultDoc: Block = {
      id: uuidv4(),
      pageId: page.id,
      type: "paragraph",
      content: {
        type: "doc",
        content: [{ type: "paragraph", content: [] }],
      },
      attrs: null,
      parentId: null,
      sortOrder: 0,
      updatedAt: now(),
    };
    localStore.upsertBlock(blockToDoc(defaultDoc));

    const ws = localStore.getWorkspace(workspaceId);
    if (ws) {
      localStore.upsertWorkspace({ ...ws, lastEdited: now(), updatedAt: now() });
      if (ws.mode === "sync") {
        await syncService.markSyncing(workspaceId);
        await syncService.pushPage(page);
        await syncService.pushBlock(defaultDoc);
        await syncService.pull();
      }
    }

    return page;
  },

  async updatePage(
    id: string,
    patch: Partial<Pick<Page, "title" | "icon" | "coverImage" | "isFavorite" | "parentId">>
  ): Promise<void> {
    const existing = localStore.getPage(id);
    if (!existing) return;

    const page = { ...existing, ...patch, updatedAt: now() };
    localStore.upsertPage(page);

    const ws = localStore.getWorkspace(page.workspaceId);
    if (ws) {
      localStore.upsertWorkspace({ ...ws, lastEdited: now(), updatedAt: now() });
      if (ws.mode === "sync") {
        await syncService.markSyncing(ws.id);
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase.rpc("page_update", {
          p_id: id,
          p_title: page.title,
          p_icon: page.icon,
          p_cover_image: page.coverImage,
          p_is_favorite: page.isFavorite,
          p_parent_id: page.parentId,
        });
        await syncService.pull();
      }
    }
  },

  async getPageDocument(pageId: string): Promise<Record<string, unknown> | null> {
    const blocks = localStore.getBlocks(pageId);
    if (blocks.length === 0) return null;
    return docToBlock(blocks[0]).content;
  },

  async savePageDocument(
    pageId: string,
    content: Record<string, unknown>
  ): Promise<void> {
    const blocks = localStore.getBlocks(pageId);

    let block: Block;
    if (blocks.length === 0) {
      block = {
        id: uuidv4(),
        pageId,
        type: "paragraph",
        content,
        attrs: null,
        parentId: null,
        sortOrder: 0,
        updatedAt: now(),
      };
      localStore.upsertBlock(blockToDoc(block));
    } else {
      const existing = docToBlock(blocks[0]);
      block = { ...existing, content, updatedAt: now() };
      localStore.upsertBlock(blockToDoc(block));
    }

    const page = localStore.getPage(pageId);
    if (page) {
      const ws = localStore.getWorkspace(page.workspaceId);
      if (ws) {
        localStore.upsertWorkspace({ ...ws, lastEdited: now(), updatedAt: now() });
        if (ws.mode === "sync") {
          await syncService.markSyncing(ws.id);
          await syncService.pushBlock(block);
        }
      }
    }
  },

  async getWorkspace(id: string): Promise<Workspace | null> {
    return localStore.getWorkspace(id) ?? null;
  },
};
