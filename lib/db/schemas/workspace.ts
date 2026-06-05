export const WORKSPACE_SCHEMA = {
  version: 1,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    name: { type: "string" },
    icon: { type: ["string", "null"], default: null },
    createdAt: { type: "number" },
    updatedAt: { type: "number" },
  },
  required: ["id", "name", "createdAt", "updatedAt"],
} as const;
