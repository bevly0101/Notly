export const WORKSPACE_SCHEMA = {
  version: 2,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    name: { type: "string" },
    icon: { type: ["string", "null"], default: null },
    isOnline: { type: "boolean", default: false },
    createdAt: { type: "number" },
    updatedAt: { type: "number" },
  },
  required: ["id", "name", "isOnline", "createdAt", "updatedAt"],
} as const;
