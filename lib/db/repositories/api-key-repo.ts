import { v4 as uuidv4 } from "uuid";
import { getDatabase } from "../database";
import type { ApiKeyDocument } from "../types";
import { encrypt, decrypt } from "@/lib/ai/crypto";

export async function getApiKeys(): Promise<ApiKeyDocument[]> {
  const db = await getDatabase();
  if (!db) return [];
  return db.api_keys.find().exec();
}

export async function getApiKeyByProvider(provider: string): Promise<ApiKeyDocument | null> {
  const db = await getDatabase();
  if (!db) return null;
  const docs = await db.api_keys.find({ selector: { provider: { $eq: provider } } }).exec();
  return docs[0] ?? null;
}

export async function getDecryptedKey(provider: string): Promise<string | null> {
  const doc = await getApiKeyByProvider(provider);
  if (!doc) return null;
  try {
    return await decrypt(doc.encryptedKey);
  } catch {
    return null;
  }
}

export async function saveApiKey(data: {
  provider: string;
  label?: string;
  key: string;
  model: string;
  temperature?: number;
}): Promise<ApiKeyDocument> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");

  const encryptedKey = await encrypt(data.key);
  const now = Date.now();

  const existing = await getApiKeyByProvider(data.provider);
  if (existing) {
    await existing.patch({
      encryptedKey,
      model: data.model,
      temperature: data.temperature ?? 0.7,
      label: data.label ?? data.provider,
      updatedAt: now,
    });
    return existing;
  }

  return db.api_keys.insert({
    id: uuidv4(),
    provider: data.provider,
    label: data.label ?? data.provider,
    encryptedKey,
    model: data.model,
    temperature: data.temperature ?? 0.7,
    createdAt: now,
    updatedAt: now,
  });
}

export async function removeApiKey(provider: string): Promise<void> {
  const doc = await getApiKeyByProvider(provider);
  if (doc) {
    await doc.remove();
  }
}

export async function testApiKey(provider: string, key: string, model: string): Promise<boolean> {
  const { getProvider } = await import("@/lib/ai/providers");
  const providerConfig = getProvider(provider);
  if (!providerConfig) return false;

  const { url, headers, body } = providerConfig.formatRequest({
    messages: [{ role: "user", content: "Say OK" }],
    model,
    temperature: 0.7,
    apiKey: key,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...(body as Record<string, unknown>), stream: false, max_tokens: 10 }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
