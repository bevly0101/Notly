export const PAGE_SCHEMA = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    workspaceId: { type: "string", maxLength: 100 },
    parentId: { type: ["string", "null"], maxLength: 100, default: null },
    title: { type: "string" },
    icon: { type: ["string", "null"], default: null },
    coverImage: { type: ["string", "null"], default: null },
    isFavorite: { type: "boolean" },
    sortOrder: { type: "number" },
    createdAt: { type: "number" },
    updatedAt: { type: "number" },
  },
  required: ["id", "workspaceId", "title", "sortOrder", "createdAt", "updatedAt"],
} as const;
