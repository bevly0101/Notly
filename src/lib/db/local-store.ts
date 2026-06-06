"use client";

import type { Workspace, Page, BlockDoc, SyncMetaDoc } from "@/lib/types";

const KEYS = {
  workspaces: "notly_workspaces",
  pages: "notly_pages",
  blocks: "notly_blocks",
  syncMeta: "notly_sync_meta",
} as const;

type StoreData = {
  workspaces: Workspace[];
  pages: Page[];
  blocks: BlockDoc[];
  syncMeta: SyncMetaDoc[];
};

type Listener = () => void;

function read<K extends keyof StoreData>(key: K): StoreData[K] {
  if (typeof window === "undefined") return [] as StoreData[K];
  const raw = localStorage.getItem(KEYS[key]);
  return raw ? (JSON.parse(raw) as StoreData[K]) : ([] as StoreData[K]);
}

function write<K extends keyof StoreData>(key: K, data: StoreData[K]) {
  localStorage.setItem(KEYS[key], JSON.stringify(data));
  notify();
}

const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const localStore = {
  getWorkspaces(): Workspace[] {
    return read("workspaces");
  },

  upsertWorkspace(workspace: Workspace) {
    const all = read("workspaces");
    const idx = all.findIndex((w) => w.id === workspace.id);
    if (idx >= 0) all[idx] = workspace;
    else all.push(workspace);
    write("workspaces", all);
  },

  removeWorkspace(id: string) {
    write(
      "workspaces",
      read("workspaces").filter((w) => w.id !== id)
    );
  },

  getWorkspace(id: string): Workspace | undefined {
    return read("workspaces").find((w) => w.id === id);
  },

  getPages(workspaceId: string): Page[] {
    return read("pages")
      .filter((p) => p.workspaceId === workspaceId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  upsertPage(page: Page) {
    const all = read("pages");
    const idx = all.findIndex((p) => p.id === page.id);
    if (idx >= 0) all[idx] = page;
    else all.push(page);
    write("pages", all);
  },

  getPage(id: string): Page | undefined {
    return read("pages").find((p) => p.id === id);
  },

  getBlocks(pageId: string): BlockDoc[] {
    return read("blocks")
      .filter((b) => b.pageId === pageId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  upsertBlock(block: BlockDoc) {
    const all = read("blocks");
    const idx = all.findIndex((b) => b.id === block.id);
    if (idx >= 0) all[idx] = block;
    else all.push(block);
    write("blocks", all);
  },

  removeBlock(id: string) {
    write(
      "blocks",
      read("blocks").filter((b) => b.id !== id)
    );
  },

  getSyncMeta(): SyncMetaDoc {
    const meta = read("syncMeta");
    return meta[0] ?? { id: "global", lastSync: new Date(0).toISOString() };
  },

  setSyncMeta(lastSync: string) {
    write("syncMeta", [{ id: "global", lastSync }]);
  },
};

export type LocalStoreReady = true;
