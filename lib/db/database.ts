import { createRxDatabase, addRxPlugin, type RxDatabase } from "rxdb/plugins/core";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { RxDBMigrationSchemaPlugin } from "rxdb/plugins/migration-schema";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { getRxStorageMemory } from "rxdb/plugins/storage-memory";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import { WORKSPACE_SCHEMA } from "./schemas/workspace";
import { PAGE_SCHEMA } from "./schemas/page";
import { BLOCK_SCHEMA } from "./schemas/block";
import { API_KEY_SCHEMA } from "./schemas/api-key";
import type { WorkspaceCollection, PageCollection, BlockCollection, ApiKeyCollection } from "./types";

addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

type NotlyCollections = {
  workspaces: WorkspaceCollection;
  pages: PageCollection;
  blocks: BlockCollection;
  api_keys: ApiKeyCollection;
};

export type NotlyDatabase = RxDatabase<NotlyCollections>;

type DbRef = {
  db: NotlyDatabase | null;
  promise: Promise<NotlyDatabase> | null;
  isMemory: boolean;
};

function getDbRef(): DbRef {
  const g = globalThis as Record<string, unknown>;
  if (!g.__notlyDb) g.__notlyDb = { db: null, promise: null, isMemory: false };
  return g.__notlyDb as DbRef;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Timeout: ${label} excedeu ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

async function tryCreate(
  storage: ReturnType<typeof wrappedValidateAjvStorage>,
  name: string,
): Promise<NotlyDatabase> {
  const database = await withTimeout(
    createRxDatabase<NotlyCollections>({
      name,
      storage,
      eventReduce: true,
      ignoreDuplicate: true,
    }),
    6000,
    "createRxDatabase",
  );

  await withTimeout(
    database.addCollections({
      workspaces: {
        schema: WORKSPACE_SCHEMA,
        migrationStrategies: {
          1: (oldDoc: Record<string, unknown>) => {
            oldDoc.icon = null;
            return oldDoc;
          },
          2: (oldDoc: Record<string, unknown>) => {
            oldDoc.isOnline = false;
            return oldDoc;
          },
        },
      },
      pages: {
        schema: PAGE_SCHEMA,
      },
      blocks: {
        schema: BLOCK_SCHEMA,
      },
      api_keys: {
        schema: API_KEY_SCHEMA,
      },
    }),
    4000,
    "addCollections",
  );

  return database;
}

export async function createDatabase(): Promise<NotlyDatabase> {
  const ref = getDbRef();
  if (ref.db) return ref.db;
  if (ref.promise) return ref.promise;

  ref.promise = (async () => {
    // Try IndexedDB first
    try {
      const storage = wrappedValidateAjvStorage({
        storage: getRxStorageDexie(),
      });
      const database = await tryCreate(storage, "notly-db");
      ref.db = database;
      ref.isMemory = false;
      return database;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`IndexedDB falhou (${msg}). A usar memória como fallback.`);

      try {
        const storage = wrappedValidateAjvStorage({
          storage: getRxStorageMemory(),
        });
        const database = await tryCreate(storage, "notly-db-memory");
        ref.db = database;
        ref.isMemory = true;
        return database;
      } catch (fallbackErr) {
        ref.promise = null;
        throw fallbackErr;
      }
    }
  })();

  return ref.promise;
}

export function isUsingMemoryStorage(): boolean {
  return getDbRef().isMemory;
}

export async function getDatabase(): Promise<NotlyDatabase | null> {
  const ref = getDbRef();
  if (ref.db) return ref.db;
  if (ref.promise) {
    try {
      return await ref.promise;
    } catch {
      return null;
    }
  }
  return null;
}

export async function waitForDatabase(): Promise<NotlyDatabase> {
  const database = await getDatabase();
  if (database) return database;
  return createDatabase();
}

export async function destroyDatabase(): Promise<void> {
  const ref = getDbRef();
  if (ref.db) {
    await (ref.db as unknown as { destroy: () => Promise<void> }).destroy();
    ref.db = null;
    ref.promise = null;
    ref.isMemory = false;
  }
}
