"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createDatabase, isUsingMemoryStorage, type NotlyDatabase } from "@/lib/db";
import type { WorkspaceDocType, PageDocType } from "@/lib/db/types";
import { getWorkspaceById, createWorkspace, updateWorkspace } from "@/lib/db/repositories/workspace-repo";
import { getPagesByWorkspace, createPage, updatePage, deletePage } from "@/lib/db/repositories/page-repo";
import { BlockRepo } from "@/lib/db";
import { useSync } from "./SyncContext";
import { syncEngine } from "@/lib/sync/sync-engine";

type WorkspaceContextValue = {
  db: NotlyDatabase | null;
  workspace: WorkspaceDocType | null;
  pages: PageDocType[];
  isReady: boolean;
  isMemory: boolean;
  currentPageId: string | null;
  setCurrentPage: (pageId: string) => void;
  addNewPage: (parentId?: string, navigate?: boolean) => Promise<PageDocType | null>;
  updatePageProp: (pageId: string, props: Partial<PageDocType>) => Promise<void>;
  deletePageById: (pageId: string) => Promise<void>;
  toggleWorkspaceOnline: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue>({
  db: null,
  workspace: null,
  pages: [],
  isReady: false,
  isMemory: false,
  currentPageId: null,
  setCurrentPage: () => {},
  addNewPage: async () => null,
  updatePageProp: async () => {},
  deletePageById: async () => {},
  toggleWorkspaceOnline: async () => {},
});

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

export function WorkspaceProvider({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: ReactNode;
}) {
  const [db, setDb] = useState<NotlyDatabase | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceDocType | null>(null);
  const [pages, setPages] = useState<PageDocType[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMemory, setIsMemory] = useState(false);
  const { syncWorkspace } = useSync();

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const database = await createDatabase();
        if (cancelled) return;
        setDb(database);
        setIsMemory(isUsingMemoryStorage());

        let ws = await getWorkspaceById(workspaceId);
        if (!ws) {
          ws = await createWorkspace({ id: workspaceId, name: "Meu Workspace", isOnline: false });
        }
        if (cancelled) return;
        setWorkspace(ws.toMutableJSON());

        const pageDocs = await getPagesByWorkspace(workspaceId);
        if (pageDocs.length === 0) {
          const firstPage = await createPage({
            workspaceId,
            title: "Página inicial",
            icon: "document-outline",
            sortOrder: 0,
          });
          if (cancelled) return;
          const pageJson = firstPage.toMutableJSON();
          setPages([pageJson]);
          setCurrentPageId(pageJson.id);
        } else {
          if (cancelled) return;
          const sorted = pageDocs.map((p) => p.toMutableJSON()).sort((a, b) => a.sortOrder - b.sortOrder);
          setPages(sorted);
          setCurrentPageId(sorted[0].id);
        }
      } catch (err) {
        console.error("Workspace init failed:", err);
      }

      setIsReady(true);
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const setCurrentPage = useCallback((pageId: string) => {
    setCurrentPageId(pageId);
  }, []);

  const addNewPage = useCallback(async (parentId?: string, navigate: boolean = true) => {
    if (!workspace) return null;
    const parentPages = pages.filter((p) => p.parentId === (parentId ?? null));
    const newPage = await createPage({
      workspaceId: workspace.id,
      parentId: parentId ?? null,
      title: "Sem título",
      icon: "document-outline",
      sortOrder: parentPages.length,
    });
    const pageJson = newPage.toMutableJSON();
    setPages((prev) => [...prev, pageJson]);
    if (navigate) {
      setCurrentPageId(pageJson.id);
    }

    await BlockRepo.createBlock({
      pageId: pageJson.id,
      type: "heading",
      content: {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Sem título" }] },
          { type: "paragraph", content: [{ type: "text", text: "Descrição opcional..." }] },
          { type: "horizontalRule" },
          { type: "paragraph", content: [] },
        ],
      },
      sortOrder: 0,
    });

    return pageJson;
  }, [workspace, pages]);

  const updatePagePropFn = useCallback(async (pageId: string, props: Partial<PageDocType>) => {
    await updatePage(pageId, props);
    setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, ...props } : p)));
  }, []);

  const toggleWorkspaceOnline = useCallback(async () => {
    if (!workspace || !db) return;
    const newState = !workspace.isOnline;
    await updateWorkspace(workspace.id, { isOnline: newState });
    setWorkspace((prev) => (prev ? { ...prev, isOnline: newState } : prev));
    if (newState) {
      await syncWorkspace(workspace.id);
    } else {
      await syncEngine.refreshOnlineWorkspaces();
    }
  }, [workspace, db, syncWorkspace]);

  const deletePageByIdFn = useCallback(async (pageId: string) => {
    await deletePage(pageId);
    setPages((prev) => {
      const remaining = prev.filter((p) => p.id !== pageId);
      if (remaining.length > 0 && currentPageId === pageId) {
        setCurrentPageId(remaining[0].id);
      }
      return remaining;
    });
  }, [currentPageId]);

  return (
    <WorkspaceContext.Provider
      value={{
        db,
        workspace,
        pages,
        isReady,
        isMemory,
        currentPageId,
        setCurrentPage,
        addNewPage,
        updatePageProp: updatePagePropFn,
        deletePageById: deletePageByIdFn,
        toggleWorkspaceOnline,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
