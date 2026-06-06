"use client";

import { useEffect, useState } from "react";
import { localStore, subscribe } from "@/lib/db/local-store";
import { useApp } from "@/providers/AppProviders";
import type { Workspace, Page } from "@/lib/types";

export function useWorkspaces() {
  const { dbReady } = useApp();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    if (!dbReady) return;
    const refresh = () => setWorkspaces(localStore.getWorkspaces());
    refresh();
    return subscribe(refresh);
  }, [dbReady]);

  return { workspaces, loading: !dbReady };
}

export function usePages(workspaceId: string) {
  const { dbReady } = useApp();
  const [pages, setPages] = useState<Page[]>([]);

  useEffect(() => {
    if (!dbReady || !workspaceId) return;
    const refresh = () => setPages(localStore.getPages(workspaceId));
    refresh();
    return subscribe(refresh);
  }, [dbReady, workspaceId]);

  return { pages, loading: !dbReady };
}

export function useWorkspace(id: string) {
  const { dbReady } = useApp();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    if (!dbReady || !id) return;
    const refresh = () => setWorkspace(localStore.getWorkspace(id) ?? null);
    refresh();
    return subscribe(refresh);
  }, [dbReady, id]);

  return { workspace, loading: !dbReady };
}
