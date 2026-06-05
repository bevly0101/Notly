import { v4 as uuidv4 } from "uuid";
import { getDatabase } from "../database";
import type { BlockDocType, BlockDocument } from "../types";

export async function getBlocksByPage(
  pageId: string,
): Promise<BlockDocument[]> {
  const db = await getDatabase();
  if (!db) return [];
  return db.blocks
    .find({
      selector: { pageId: { $eq: pageId } },
      sort: [{ sortOrder: "asc" }],
    })
    .exec();
}

export async function getBlockById(id: string): Promise<BlockDocument | null> {
  const db = await getDatabase();
  if (!db) return null;
  return db.blocks.findOne(id).exec();
}

export async function createBlock(
  data: Partial<BlockDocType>,
): Promise<BlockDocument> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");

  const now = Date.now();
  return db.blocks.insert({
    id: uuidv4(),
    pageId: "",
    type: "paragraph",
    content: null,
    attrs: null,
    parentId: null,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    ...data,
  });
}

export async function updateBlock(
  id: string,
  data: Partial<BlockDocType>,
): Promise<BlockDocument> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");

  const doc = await db.blocks.findOne(id).exec();
  if (!doc) throw new Error("Block not found");

  await doc.patch({
    ...data,
    updatedAt: Date.now(),
  });
  return doc;
}

export async function deleteBlock(id: string): Promise<void> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");

  const doc = await db.blocks.findOne(id).exec();
  if (doc) {
    await doc.remove();
  }
}

export async function deleteBlocksByPage(pageId: string): Promise<void> {
  const blocks = await getBlocksByPage(pageId);
  await Promise.all(blocks.map((block) => block.remove()));
}
