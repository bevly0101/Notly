"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaces } from "@/lib/hooks/useRxQuery";
import { useApp } from "@/providers/AppProviders";
import { dataService } from "@/lib/data-service";
import { createClient } from "@/lib/supabase/client";
import {
  TabBar,
  filterWorkspacesByTab,
  useDashboardPrefs,
  type TabFilter,
} from "@/components/dashboard/TabBar";
import { ViewToggle } from "@/components/dashboard/ViewToggle";
import { WorkspaceCard } from "@/components/dashboard/WorkspaceCard";
import { CreateWorkspaceModal } from "@/components/dashboard/CreateWorkspaceModal";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { WorkspaceMode } from "@/lib/types";

export default function WorkspacesPage() {
  const router = useRouter();
  const { workspaces, loading } = useWorkspaces();
  const { user, isLocalMode, dbReady } = useApp();
  const { viewMode, setView, customTabs, addCustomTab } = useDashboardPrefs();
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = filterWorkspacesByTab(
    workspaces,
    activeTab,
    customTabs.map((t) => t.id)
  );

  useEffect(() => {
    if (!dbReady || loading) return;
    if (isLocalMode && workspaces.length === 0) {
      dataService.createWorkspace("Local Workspace", "local", "📁");
    }
  }, [dbReady, loading, isLocalMode, workspaces.length]);

  const handleCreate = async (name: string, mode: WorkspaceMode, icon: string) => {
    const ws = await dataService.createWorkspace(name, mode, icon);
    router.push(`/w/${ws.id}`);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading || !dbReady) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <p className="text-on-surface-variant">Loading workspaces...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg" data-testid="workspaces-page">
      <header className="sticky top-0 z-10 flex justify-between items-center h-14 px-margin-page border-b border-outline-variant backdrop-blur-md bg-background/80">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📝</span>
          <h1 className="text-headline-md font-bold text-primary">NOTLY</h1>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-body-sm text-on-surface-variant hidden sm:block">
              {user.email}
            </span>
          )}
          {isLocalMode && (
            <span className="text-label-mono font-mono text-secondary text-[11px] uppercase">
              Local mode
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-on-surface-variant hover:text-primary transition-colors"
            title="Sign out"
          >
            <MaterialIcon name="logout" size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto p-margin-page space-y-8">
        <div>
          <h2 className="text-display-lg font-bold text-primary mb-2">Workspaces</h2>
          <p className="text-body-sm text-on-surface-variant">
            Manage your local and synced workspaces
          </p>
        </div>

        <section className="flex items-center justify-between flex-wrap gap-4">
          <TabBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            customTabs={customTabs}
            onAddTab={addCustomTab}
          />
          <ViewToggle viewMode={viewMode} onChange={setView} />
        </section>

        <section
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              : "flex flex-col gap-4"
          }
        >
          <button
            onClick={() => setModalOpen(true)}
            className="glass-card rounded-2xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-3 h-[280px] hover:border-secondary transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
              <MaterialIcon name="add" className="text-secondary" size={32} />
            </div>
            <span className="font-bold text-primary">Create New</span>
          </button>

          {filtered.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} viewMode={viewMode} />
          ))}
        </section>
      </main>

      <CreateWorkspaceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
        canSync={!!user && !isLocalMode}
      />
    </div>
  );
}
