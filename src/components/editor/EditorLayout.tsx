"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { SyncStatusIndicator } from "@/components/ui/SyncStatusIndicator";
import { PageTree } from "./PageTree";
import { AIPanel } from "@/components/workspace/AIPanel";
import type { Workspace, Page } from "@/lib/types";
import { dataService } from "@/lib/data-service";

export function EditorSidebar({
  workspace,
  pages,
  currentPageId,
  onNewPage,
}: {
  workspace: Workspace;
  pages: Page[];
  currentPageId: string;
  onNewPage: () => void;
}) {
  return (
    <nav className="hidden md:flex bg-surface-container h-screen w-sidebar-width border-r border-outline-variant flex-col py-4 px-3 shrink-0 z-30">
      <Link
        href={`/w/${workspace.id}`}
        className="flex items-center px-3 py-4 mb-2 group cursor-pointer rounded-lg hover:bg-surface-variant transition-all"
      >
        <div className="w-8 h-8 rounded bg-surface-bright flex items-center justify-center mr-3 text-lg">
          {workspace.icon ?? "📁"}
        </div>
        <div className="flex-1 overflow-hidden">
          <h2 className="text-body-sm font-bold text-primary truncate">{workspace.name}</h2>
          <p className="text-label-mono font-mono text-on-surface-variant truncate">
            {workspace.mode === "sync" ? "Local-first Sync" : "Local only"}
          </p>
        </div>
      </Link>

      <div className="flex-1 overflow-y-auto space-y-1">
        <Link
          href={`/w/${workspace.id}`}
          className="flex items-center px-3 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant text-body-sm"
        >
          <MaterialIcon name="dashboard" className="mr-3" size={20} />
          Dashboard
        </Link>
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 py-2 bg-surface-bright text-primary rounded-lg border-l-2 border-secondary">
            <div className="flex items-center">
              <MaterialIcon name="database" className="mr-3" filled size={20} />
              <span className="text-body-sm font-semibold">Pages</span>
            </div>
            <button onClick={onNewPage} className="opacity-60 hover:opacity-100">
              <MaterialIcon name="add" size={16} />
            </button>
          </div>
          <PageTree
            pages={pages}
            workspaceId={workspace.id}
            currentPageId={currentPageId}
          />
        </div>
      </div>

      <div className="pt-4 mt-auto border-t border-outline-variant/30 space-y-2">
        <button
          onClick={onNewPage}
          className="w-full flex items-center justify-center py-2 px-4 rounded-lg bg-primary text-on-primary font-medium hover:bg-primary-fixed-dim transition-colors inner-glow text-body-sm"
        >
          <MaterialIcon name="add" className="mr-2" size={18} />
          New Page
        </button>
      </div>
    </nav>
  );
}

export function EditorBreadcrumbs({
  workspace,
  page,
  ancestors,
}: {
  workspace: Workspace;
  page: Page;
  ancestors: Page[];
}) {
  const crumbs = [...ancestors, page];

  return (
    <div className="flex items-center text-label-mono font-mono text-on-surface-variant overflow-x-auto whitespace-nowrap hide-scrollbar">
      <Link href={`/w/${workspace.id}`} className="hover:text-primary transition-colors">
        {workspace.name}
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.id} className="flex items-center">
          <span className="mx-2 opacity-40">/</span>
          {i < crumbs.length - 1 ? (
            <Link
              href={`/w/${workspace.id}/p/${crumb.id}`}
              className="hover:text-primary transition-colors"
            >
              {crumb.title}
            </Link>
          ) : (
            <span className="text-primary font-medium">{crumb.title}</span>
          )}
        </span>
      ))}
    </div>
  );
}

export function EditorShell({
  workspace,
  page,
  pages,
  children,
}: {
  workspace: Workspace;
  page: Page;
  pages: Page[];
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleNewPage = async () => {
    const newPage = await dataService.createPage(workspace.id);
    router.push(`/w/${workspace.id}/p/${newPage.id}`);
  };

  const ancestors = pages.filter((p) => {
    if (!page.parentId) return false;
    let current: string | null = page.parentId;
    while (current) {
      if (p.id === current) return true;
      const parent = pages.find((x) => x.id === current);
      current = parent?.parentId ?? null;
    }
    return false;
  });

  return (
    <div className="flex h-screen overflow-hidden mesh-bg">
      <EditorSidebar
        workspace={workspace}
        pages={pages}
        currentPageId={page.id}
        onNewPage={handleNewPage}
      />
      <main className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
        <div className="h-14 flex items-center justify-between px-6 border-b border-outline-variant/20 shrink-0 backdrop-blur-sm bg-background/80">
          <EditorBreadcrumbs workspace={workspace} page={page} ancestors={ancestors} />
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center text-label-mono font-mono text-on-surface-variant bg-surface-container-high px-2 py-1 rounded border border-outline-variant/30 gap-2">
              <SyncStatusIndicator status={workspace.status} />
              {workspace.mode === "local" ? "Saved locally" : "Synced"}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
      <AIPanel className="hidden lg:flex" />
    </div>
  );
}
