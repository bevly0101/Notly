import { type RxJsonSchema } from "rxdb/plugins/core";

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

export const API_KEY_SCHEMA: RxJsonSchema<ApiKeyDocType> = {
  title: "api key schema",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 128 },
    provider: { type: "string" },
    label: { type: "string" },
    encryptedKey: { type: "string" },
    model: { type: "string" },
    temperature: { type: "number" },
    createdAt: { type: "number" },
    updatedAt: { type: "number" },
  },
  required: ["id", "provider", "encryptedKey", "model", "temperature", "createdAt", "updatedAt"],
};
