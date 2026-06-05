import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotlyDatabase } from "@/lib/db/database";
import type { SyncStatus, PushChange, SyncCollection, InitialSyncProgress } from "./types";
import { pullChanges } from "./pull-worker";

const DEBOUNCE_MS = 1000;
const PULL_INTERVAL_MS = 30000;
const MAX_RETRIES = 3;

type Unsubscribe = () => void;

export class SyncEngine {
  private db: NotlyDatabase | null = null;
  private supabase: SupabaseClient | null = null;
  private unsubs: Unsubscribe[] = [];
  private changeBuffer: PushChange[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pullInterval: ReturnType<typeof setInterval> | null = null;
  private _isPulling = false;
  private _status: SyncStatus = "idle";
  private statusListeners = new Set<(s: SyncStatus) => void>();
  private _lastSyncedAt: number | null = null;
  private progressListeners = new Set<(p: InitialSyncProgress) => void>();
  private pushRetryQueue: PushChange[] = [];

  setDatabase(db: NotlyDatabase) {
    this.db = db;
  }

  setSupabase(client: SupabaseClient) {
    this.supabase = client;
  }

  get status(): SyncStatus {
    return this._status;
  }

  get lastSyncedAt(): number | null {
    return this._lastSyncedAt;
  }

  onStatusChange(listener: (s: SyncStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  onInitialSyncProgress(listener: (p: InitialSyncProgress) => void): () => void {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  private setStatus(s: SyncStatus) {
    this._status = s;
    this.statusListeners.forEach((l) => l(s));
  }

  get isRunning(): boolean {
    return this.pullInterval !== null || this.unsubs.length > 0;
  }

  async start() {
    if (this.isRunning || !this.db || !this.supabase) return;

    this.setStatus("syncing");
    this.startPullWorker();
    this.observeChanges();
  }

  stop() {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    if (this.pullInterval) {
      clearInterval(this.pullInterval);
      this.pullInterval = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.changeBuffer = [];
    this.pushRetryQueue = [];
    this.setStatus("idle");
  }

  async initialSync(): Promise<void> {
    if (!this.db || !this.supabase) return;

    this.setStatus("initial-syncing");

    const workspaces = await this.db.workspaces.find().exec();
    const pages = await this.db.pages.find().exec();
    const blocks = await this.db.blocks.find().exec();

    const total = workspaces.length + pages.length + blocks.length;
    let current = 0;

    const report = () => {
      current++;
      this.progressListeners.forEach((l) => l({ current, total }));
    };

    try {
      for (const ws of workspaces) {
        await this.pushCreate("workspaces", ws.toJSON());
        report();
      }
      for (const pg of pages) {
        await this.pushCreate("pages", pg.toJSON());
        report();
      }
      for (const bl of blocks) {
        await this.pushCreate("blocks", bl.toJSON());
        report();
      }
    } catch (err) {
      console.error("[Sync] Initial sync failed:", err);
      this.setStatus("error");
      return;
    }

    this._lastSyncedAt = Date.now();
    this.setStatus("synced");
  }

  async syncNow(): Promise<void> {
    if (!this.db || !this.supabase) return;
    this.setStatus("syncing");

    await this.flushChanges();
    await pullChanges(this.supabase, this.db);

    this._lastSyncedAt = Date.now();
    if (this.pushRetryQueue.length === 0) {
      this.setStatus("synced");
    }
  }

  /* ---------- private ---------- */

  private observeChanges() {
    if (!this.db) return;

    const collections: { name: SyncCollection; col: unknown }[] = [
      { name: "workspaces", col: this.db.workspaces },
      { name: "pages", col: this.db.pages },
      { name: "blocks", col: this.db.blocks },
    ];

    for (const { name, col } of collections) {
      const collection = col as {
        insert$: { subscribe: (fn: (ev: { documentId: string; doc: Record<string, unknown> }) => void) => Unsubscribe };
        update$: { subscribe: (fn: (ev: { documentId: string }) => void) => Unsubscribe };
        remove$: { subscribe: (fn: (ev: { documentId: string; previousData: Record<string, unknown> }) => void) => Unsubscribe };
        findOne: (id: string) => { exec: () => Promise<{ toJSON: () => Record<string, unknown> } | null> };
      };

      const insertSub = collection.insert$.subscribe((ev) => {
        if (this._isPulling) return;
        this.enqueue({ collection: name, operation: "create", id: ev.documentId, doc: ev.doc });
      });

      const updateSub = collection.update$.subscribe(async (ev) => {
        if (this._isPulling) return;
        const doc = await collection.findOne(ev.documentId).exec();
        if (!doc) return;
        this.enqueue({ collection: name, operation: "update", id: ev.documentId, doc: doc.toJSON() });
      });

      const removeSub = collection.remove$.subscribe((ev) => {
        if (this._isPulling) return;
        this.enqueue({ collection: name, operation: "delete", id: ev.documentId, doc: ev.previousData });
      });

      this.unsubs.push(insertSub, updateSub, removeSub);
    }
  }

  private enqueue(change: PushChange) {
    this.changeBuffer = this.changeBuffer.filter((c) => !(c.collection === change.collection && c.id === change.id));
    this.changeBuffer.push(change);

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.flushChanges(), DEBOUNCE_MS);
  }

  private async flushChanges() {
    const batch = this.changeBuffer.splice(0);
    if (batch.length === 0) return;

    this.setStatus("syncing");
    let allSucceeded = true;

    for (const change of batch) {
      let success = false;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          await this.pushChange(change);
          success = true;
          break;
        } catch (err) {
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
          } else {
            console.error(`[Sync] Push failed after ${MAX_RETRIES} retries:`, change.collection, change.id, err);
            this.pushRetryQueue.push(change);
          }
        }
      }
      if (!success) {
        allSucceeded = false;
        break;
      }
    }

    if (allSucceeded && this.pushRetryQueue.length === 0) {
      this._lastSyncedAt = Date.now();
      this.setStatus("synced");
    } else {
      this.setStatus("error");
    }
  }

  private async pushChange(change: PushChange) {
    if (!this.supabase) return;

    switch (change.operation) {
      case "create":
        await this.pushCreate(change.collection, change.doc);
        break;
      case "update":
        await this.pushUpdate(change.collection, change.doc);
        break;
      case "delete":
        await this.pushDelete(change.collection, change.id);
        break;
    }
  }

  private async callRpc(name: string, args: Record<string, unknown>): Promise<void> {
    if (!this.supabase) return;

    const { error } = await this.supabase.rpc(name, args);

    if (error) {
      throw new Error(`RPC ${name} falhou: ${error.message}`);
    }
  }

  private async pushCreate(collection: SyncCollection, doc: Record<string, unknown>) {
    switch (collection) {
      case "workspaces":
        await this.callRpc("workspace_create", {
          p_id: doc.id,
          p_name: doc.name ?? "",
          p_icon: doc.icon ?? null,
          p_metadata: {},
        });
        break;
      case "pages":
        await this.callRpc("page_create", {
          p_id: doc.id,
          p_workspace_id: doc.workspaceId,
          p_parent_id: doc.parentId ?? null,
          p_title: doc.title ?? "Sem título",
          p_icon: doc.icon ?? null,
          p_sort_order: doc.sortOrder ?? 0,
          p_metadata: {},
        });
        break;
      case "blocks":
        await this.callRpc("block_create", {
          p_id: doc.id,
          p_page_id: doc.pageId,
          p_type: doc.type ?? "paragraph",
          p_content: doc.content ?? null,
          p_attrs: doc.attrs ?? null,
          p_parent_id: doc.parentId ?? null,
          p_sort_order: doc.sortOrder ?? 0,
          p_metadata: {},
        });
        break;
    }
  }

  private async pushUpdate(collection: SyncCollection, doc: Record<string, unknown>) {
    switch (collection) {
      case "workspaces":
        await this.callRpc("workspace_update", {
          p_id: doc.id,
          p_name: doc.name ?? null,
          p_icon: doc.icon ?? null,
          p_metadata: null,
        });
        break;
      case "pages":
        await this.callRpc("page_update", {
          p_id: doc.id,
          p_title: doc.title ?? null,
          p_icon: doc.icon ?? null,
          p_cover_image: doc.coverImage ?? null,
          p_is_favorite: doc.isFavorite ?? null,
          p_sort_order: doc.sortOrder ?? null,
          p_parent_id: doc.parentId ?? null,
          p_metadata: null,
        });
        break;
      case "blocks":
        await this.callRpc("block_update", {
          p_id: doc.id,
          p_type: doc.type ?? null,
          p_content: doc.content ?? null,
          p_attrs: doc.attrs ?? null,
          p_sort_order: doc.sortOrder ?? null,
          p_parent_id: doc.parentId ?? null,
          p_metadata: null,
        });
        break;
    }
  }

  private async pushDelete(collection: SyncCollection, id: string) {
    switch (collection) {
      case "workspaces":
        await this.callRpc("workspace_delete", { p_id: id });
        break;
      case "pages":
        await this.callRpc("page_delete", { p_id: id });
        break;
      case "blocks":
        await this.callRpc("block_delete", { p_id: id });
        break;
    }
  }

  private startPullWorker() {
    this.pullInterval = setInterval(async () => {
      if (!this.supabase || !this.db || this._isPulling) return;

      this._isPulling = true;
      try {
        const count = await pullChanges(this.supabase, this.db);
        if (count > 0) {
          this._lastSyncedAt = Date.now();
        }
      } catch (err) {
        console.error("[Sync] Pull worker error:", err);
      } finally {
        this._isPulling = false;
      }
    }, PULL_INTERVAL_MS);
  }
}

export const syncEngine = new SyncEngine();
