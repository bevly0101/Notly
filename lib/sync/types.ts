export type SyncStatus = "idle" | "initial-syncing" | "syncing" | "error" | "synced";

export type SyncCollection = "workspaces" | "pages" | "blocks";

export type SyncOperation = "create" | "update" | "delete";

export type PushChange = {
  collection: SyncCollection;
  operation: SyncOperation;
  id: string;
  doc: Record<string, unknown>;
};

export type SyncLogAction = "create" | "update" | "soft_delete" | "restore";

export type SyncLogEntry = {
  id: string;
  table_name: string;
  record_id: string;
  action: SyncLogAction;
  snapshot: Record<string, unknown>;
  created_at: string;
};

export type InitialSyncProgress = {
  current: number;
  total: number;
};
