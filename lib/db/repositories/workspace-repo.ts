import { v4 as uuidv4 } from "uuid";
import { getDatabase } from "../database";
import type { WorkspaceDocType, WorkspaceDocument } from "../types";

export async function getAllWorkspaces(): Promise<WorkspaceDocument[]> {
  const db = await getDatabase();
  if (!db) return [];
  return db.workspaces.find().exec();
}

export async function getWorkspaceById(
  id: string,
): Promise<WorkspaceDocument | null> {
  const db = await getDatabase();
  if (!db) return null;
  return db.workspaces.findOne(id).exec();
}

export async function createWorkspace(
  data: Partial<WorkspaceDocType>,
): Promise<WorkspaceDocument> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");

  const now = Date.now();
  return db.workspaces.insert({
    id: uuidv4(),
    name: "Meu Workspace",
    icon: null,
    createdAt: now,
    updatedAt: now,
    ...data,
  });
}

export async function updateWorkspace(
  id: string,
  data: Partial<WorkspaceDocType>,
): Promise<WorkspaceDocument> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");

  const doc = await db.workspaces.findOne(id).exec();
  if (!doc) throw new Error("Workspace not found");

  await doc.patch({
    ...data,
    updatedAt: Date.now(),
  });
  return doc;
}

export async function deleteWorkspace(id: string): Promise<void> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");

  const doc = await db.workspaces.findOne(id).exec();
  if (doc) {
    await doc.remove();
  }
}
