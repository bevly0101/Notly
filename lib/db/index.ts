export { createDatabase, getDatabase, waitForDatabase, destroyDatabase, isUsingMemoryStorage } from "./database";
export type { NotlyDatabase } from "./database";

export * as WorkspaceRepo from "./repositories/workspace-repo";
export * as PageRepo from "./repositories/page-repo";
export * as BlockRepo from "./repositories/block-repo";

export type {
  WorkspaceDocType,
  PageDocType,
  BlockDocType,
  WorkspaceDocument,
  PageDocument,
  BlockDocument,
} from "./types";
