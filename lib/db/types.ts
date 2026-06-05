import type { RxCollection, RxDocument } from "rxdb/plugins/core";

export type WorkspaceDocType = {
  id: string;
  name: string;
  icon: string | null;
  createdAt: number;
  updatedAt: number;
};

export type PageDocType = {
  id: string;
  workspaceId: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  coverImage: string | null;
  isFavorite: boolean;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
};

export type BlockDocType = {
  id: string;
  pageId: string;
  type: string;
  content: Record<string, unknown> | null;
  attrs: Record<string, unknown> | null;
  parentId: string | null;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
};

export type ApiKeyDocType = {
  id: string;
  provider: string;
  label: string;
  encryptedKey: string;
  model: string;
  temperature: number;
  createdAt: number;
  updatedAt: number;
};

export type WorkspaceDocument = RxDocument<WorkspaceDocType>;
export type PageDocument = RxDocument<PageDocType>;
export type BlockDocument = RxDocument<BlockDocType>;
export type ApiKeyDocument = RxDocument<ApiKeyDocType>;

export type WorkspaceCollection = RxCollection<WorkspaceDocType>;
export type PageCollection = RxCollection<PageDocType>;
export type BlockCollection = RxCollection<BlockDocType>;
export type ApiKeyCollection = RxCollection<ApiKeyDocType>;
