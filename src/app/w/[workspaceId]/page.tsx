"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspace, usePages } from "@/lib/hooks/useRxQuery";
import { dataService } from "@/lib/data-service";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { PageCard, CreatePageCard } from "@/components/workspace/PageCard";
import { AIPanel } from "@/components/workspace/AIPanel";
import { MobileNav } from "@/components/workspace/MobileNav";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { ViewToggle } from "@/components/dashboard/ViewToggle";

type PageFilter = "all" | "pinned";

export default function WorkspaceHomePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const { workspace, loading: wsLoading } = useWorkspace(workspaceId);
  const { pages, loading: pagesLoading } = usePages(workspaceId);
  const [filter, setFilter] = useState<PageFilter>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered =
    filter === "pinned" ? pages.filter((p) => p.isFavorite) : pages;

  const handleNewPage = async () => {
    const page = await dataService.createPage(workspaceId);
    router.push(`/w/${workspaceId}/p/${page.id}`);
  };

  if (wsLoading || pagesLoading || !workspace) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <p className="text-on-surface-variant">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden mesh-bg">
      <WorkspaceSidebar workspace={workspace} onNewPage={handleNewPage} />

      <main className="flex-1 h-screen overflow-y-auto relative pb-20 md:pb-0">
        <header className="sticky top-0 z-10 flex justify-between items-center h-12 px-gutter w-full bg-surface border-b border-outline-variant backdrop-blur-md bg-opacity-80">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <MaterialIcon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                size={20}
              />
              <input
                className="w-full bg-surface-container-low border-none rounded-md py-1.5 pl-10 pr-4 text-body-sm focus:ring-1 focus:ring-secondary text-on-surface placeholder:text-on-surface-variant"
                placeholder="Search pages, commands, or AI assistant..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MaterialIcon name="sync" className="text-on-surface-variant" size={20} />
            <MaterialIcon name="cloud_done" className="text-on-surface-variant" size={20} />
          </div>
        </header>

        {/* Mobile header */}
        <div className="md:hidden px-4 pt-4 space-y-1">
          <h1 className="text-headline-md font-bold text-primary">Dashboard</h1>
          <p className="text-body-sm text-on-surface-variant">Your local-first workspace overview.</p>
        </div>

        {/* Mobile recently accessed */}
        <section className="md:hidden -mx-0 px-4 pt-4">
          <h2 className="text-label-mono font-mono text-on-surface-variant uppercase tracking-wider mb-4">
            Recently Accessed
          </h2>
          <div className="flex overflow-x-auto hide-scrollbar space-x-3 pb-2">
            {pages.slice(0, 3).map((page) => (
              <button
                key={page.id}
                onClick={() => router.push(`/w/${workspaceId}/p/${page.id}`)}
                className="snap-start flex-none w-40 bg-surface-container-low border border-outline-variant rounded-lg p-3 flex flex-col space-y-2"
              >
                <span className="text-2xl">{page.icon ?? "📄"}</span>
                <h3 className="text-body-sm text-primary truncate text-left">{page.title}</h3>
              </button>
            ))}
          </div>
        </section>

        <div className="max-w-[1200px] mx-auto p-margin-page space-y-6">
          <section className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(["all", "pinned"] as PageFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-body-sm font-bold capitalize transition-colors ${
                    filter === f
                      ? "bg-secondary-container text-on-secondary-container"
                      : "hover:bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {f === "all" ? "All" : "Pinned"}
                </button>
              ))}
            </div>
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />
          </section>

          <section
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                : "flex flex-col gap-4"
            }
          >
            <CreatePageCard onClick={handleNewPage} />
            {filtered.map((page) => (
              <PageCard key={page.id} page={page} workspaceId={workspaceId} />
            ))}
          </section>
        </div>
      </main>

      <AIPanel className="hidden xl:flex" />
      <MobileNav workspaceId={workspaceId} />
    </div>
  );
}
