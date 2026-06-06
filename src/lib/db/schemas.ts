export const workspaceSchema = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 40 },
    name: { type: "string" },
    mode: { type: "string", maxLength: 10 },
    icon: { type: "string" },
    lastEdited: { type: "string", maxLength: 40 },
    status: { type: "string", maxLength: 20 },
    userId: { type: "string", maxLength: 40 },
    updatedAt: { type: "string", maxLength: 40 },
  },
  required: ["id", "name", "mode", "lastEdited", "status", "updatedAt"],
  indexes: ["mode"],
} as const;

export const pageSchema = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 40 },
    workspaceId: { type: "string", maxLength: 40 },
    parentId: { type: "string", maxLength: 40 },
    title: { type: "string" },
    icon: { type: "string" },
    coverImage: { type: "string" },
    isFavorite: { type: "boolean" },
    sortOrder: { type: "number" },
    path: { type: "string" },
    updatedAt: { type: "string", maxLength: 40 },
  },
  required: ["id", "workspaceId", "title", "isFavorite", "sortOrder", "updatedAt"],
  indexes: ["workspaceId"],
} as const;

export const blockSchema = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 40 },
    pageId: { type: "string", maxLength: 40 },
    type: { type: "string", maxLength: 30 },
    contentJson: { type: "string" },
    attrsJson: { type: "string" },
    parentId: { type: "string", maxLength: 40 },
    sortOrder: { type: "number" },
    updatedAt: { type: "string", maxLength: 40 },
  },
  required: ["id", "pageId", "type", "sortOrder", "updatedAt"],
  indexes: ["pageId"],
} as const;

export const syncMetaSchema = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 50 },
    lastSync: { type: "string", maxLength: 40 },
  },
  required: ["id", "lastSync"],
} as const;
