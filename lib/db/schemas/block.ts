export const BLOCK_SCHEMA = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    pageId: { type: "string", maxLength: 100 },
    type: { type: "string" },
    content: { type: ["object", "null"], default: null },
    attrs: { type: ["object", "null"], default: null },
    parentId: { type: ["string", "null"], maxLength: 100, default: null },
    sortOrder: { type: "number" },
    createdAt: { type: "number" },
    updatedAt: { type: "number" },
  },
  required: ["id", "pageId", "type", "sortOrder", "createdAt", "updatedAt"],
} as const;
