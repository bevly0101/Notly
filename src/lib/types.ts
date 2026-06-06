export type WorkspaceMode = "local" | "sync";
export type SyncStatus = "synced" | "offline" | "syncing";

export interface Workspace {
  id: string;
  name: string;
  mode: WorkspaceMode;
  icon: string | null;
  lastEdited: string;
  status: SyncStatus;
  userId?: string | null;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Page {
  id: string;
  workspaceId: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  coverImage: string | null;
  isFavorite: boolean;
  sortOrder: number;
  path?: string | null;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface SyncMetaDoc {
  id: string;
  lastSync: string;
}

export interface BlockDoc {
  id: string;
  pageId: string;
  type: string;
  contentJson: string;
  attrsJson?: string;
  parentId?: string;
  sortOrder: number;
  updatedAt: string;
}

export interface Block {
  id: string;
  pageId: string;
  type: string;
  content: Record<string, unknown> | null;
  attrs: Record<string, unknown> | null;
  parentId: string | null;
  sortOrder: number;
  updatedAt: string;
}

export function blockToDoc(block: Block): BlockDoc {
  return {
    id: block.id,
    pageId: block.pageId,
    type: block.type,
    contentJson: JSON.stringify(block.content ?? {}),
    attrsJson: block.attrs ? JSON.stringify(block.attrs) : undefined,
    parentId: block.parentId ?? undefined,
    sortOrder: block.sortOrder,
    updatedAt: block.updatedAt,
  };
}

export function docToBlock(doc: BlockDoc): Block {
  return {
    id: doc.id,
    pageId: doc.pageId,
    type: doc.type,
    content: doc.contentJson ? JSON.parse(doc.contentJson) : null,
    attrs: doc.attrsJson ? JSON.parse(doc.attrsJson) : null,
    parentId: doc.parentId ?? null,
    sortOrder: doc.sortOrder,
    updatedAt: doc.updatedAt,
  };
}

export type ViewMode = "grid" | "list";

export interface CustomTab {
  id: string;
  label: string;
  filter: (workspace: Workspace) => boolean;
}
