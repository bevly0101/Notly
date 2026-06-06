"use client";

import { localStore } from "./local-store";

export type NotlyDatabase = typeof localStore;

let ready = false;

export async function getDatabase(): Promise<NotlyDatabase> {
  if (typeof window === "undefined") {
    throw new Error("Database can only be initialized in the browser");
  }
  ready = true;
  return localStore;
}

export function isDatabaseReady() {
  return ready;
}
