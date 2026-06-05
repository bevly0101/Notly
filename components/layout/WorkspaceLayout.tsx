"use client";

import type { ReactNode } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import EditorHeader from "@/components/editor/EditorHeader";
import RightPanel from "@/components/panel/RightPanel";
import { useWorkspace } from "@/lib/contexts/WorkspaceContext";
import { LayoutProvider, useLayout } from "@/lib/contexts/LayoutContext";

type Props = {
  children: ReactNode;
};

function LayoutInner({ children }: Props) {
  const { currentPageId } = useWorkspace();
  const { sidebarOpen, setSidebarOpen, panelOpen, setPanelOpen } = useLayout();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 z-40 md:hidden animate-slide-in h-full">
            <Sidebar />
          </aside>
        </>
      )}

      <div className="flex flex-col flex-1 min-w-0">
        <EditorHeader />
        <div className="flex flex-1 overflow-hidden">
          <main
            className="flex-1 overflow-y-auto"
            key={currentPageId ?? "none"}
          >
            {children}
          </main>
          {/* Desktop right panel */}
          <div className="hidden lg:block">
            <RightPanel />
          </div>
          {/* Mobile right panel drawer */}
          {panelOpen && (
            <>
              <div
                className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                onClick={() => setPanelOpen(false)}
              />
              <aside className="fixed right-0 top-0 bottom-0 z-40 w-64 lg:hidden animate-slide-in-right h-full">
                <RightPanel />
              </aside>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceLayout({ children }: Props) {
  return (
    <LayoutProvider>
      <LayoutInner>{children}</LayoutInner>
    </LayoutProvider>
  );
}
