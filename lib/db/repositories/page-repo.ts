import { v4 as uuidv4 } from "uuid";
import { getDatabase } from "../database";
import type { PageDocType, PageDocument } from "../types";

export async function getPagesByWorkspace(
  workspaceId: string,
): Promise<PageDocument[]> {
  const db = await getDatabase();
  if (!db) return [];
  return db.pages
    .find({
      selector: {
        workspaceId: { $eq: workspaceId },
      },
      sort: [{ sortOrder: "asc" }],
    })
    .exec();
}

export async function getPageById(id: string): Promise<PageDocument | null> {
  const db = await getDatabase();
  if (!db) return null;
  return db.pages.findOne(id).exec();
}

export async function createPage(
  data: Partial<PageDocType>,
): Promise<PageDocument> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");

  const now = Date.now();
  return db.pages.insert({
    id: uuidv4(),
    workspaceId: "",
    parentId: null,
    title: "Sem título",
    icon: null,
    coverImage: null,
    isFavorite: false,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    ...data,
  });
}

export async function updatePage(
  id: string,
  data: Partial<PageDocType>,
): Promise<PageDocument> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");

  const doc = await db.pages.findOne(id).exec();
  if (!doc) throw new Error("Page not found");

  await doc.patch({
    ...data,
    updatedAt: Date.now(),
  });
  return doc;
}

export async function deletePage(id: string): Promise<void> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");

  const doc = await db.pages.findOne(id).exec();
  if (doc) {
    await doc.remove();
  }
}

export async function toggleFavorite(
  id: string,
): Promise<PageDocument> {
  const doc = await getPageById(id);
  if (!doc) throw new Error("Page not found");
  return updatePage(id, { isFavorite: !doc.isFavorite });
}
