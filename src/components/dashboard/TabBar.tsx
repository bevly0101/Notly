"use client";

import { useState, useEffect } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { Workspace } from "@/lib/types";

export type TabFilter = "all" | "sync" | "local" | string;

interface TabBarProps {
  activeTab: TabFilter;
  onTabChange: (tab: TabFilter) => void;
  customTabs: { id: string; label: string }[];
  onAddTab: (label: string) => void;
}

export function TabBar({
  activeTab,
  onTabChange,
  customTabs,
  onAddTab,
}: TabBarProps) {
  const fixedTabs: { id: TabFilter; label: string }[] = [
    { id: "all", label: "ALL" },
    { id: "sync", label: "Sync" },
    { id: "local", label: "Local" },
  ];

  const handleAdd = () => {
    const label = prompt("Nome da nova guia:");
    if (label?.trim()) onAddTab(label.trim());
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {[...fixedTabs, ...customTabs.map((t) => ({ id: t.id, label: t.label }))].map(
        (tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-1.5 rounded-full text-body-sm font-bold transition-colors ${
              activeTab === tab.id
                ? "bg-secondary-container text-on-secondary-container"
                : "hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
          </button>
        )
      )}
      <button
        onClick={handleAdd}
        className="p-1.5 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-colors"
        title="Nova guia"
      >
        <MaterialIcon name="add" size={20} />
      </button>
    </div>
  );
}

export function filterWorkspacesByTab(
  workspaces: Workspace[],
  tab: TabFilter,
  customTabIds: string[]
): Workspace[] {
  if (tab === "all") return workspaces;
  if (tab === "sync") return workspaces.filter((w) => w.mode === "sync");
  if (tab === "local") return workspaces.filter((w) => w.mode === "local");
  if (customTabIds.includes(tab)) {
    const stored = localStorage.getItem(`notly_tab_${tab}`);
    if (stored) {
      const ids: string[] = JSON.parse(stored);
      return workspaces.filter((w) => ids.includes(w.id));
    }
  }
  return workspaces;
}

export function useDashboardPrefs() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [customTabs, setCustomTabs] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    const vm = localStorage.getItem("notly_view_mode");
    if (vm === "grid" || vm === "list") setViewMode(vm);
    const tabs = localStorage.getItem("notly_custom_tabs");
    if (tabs) setCustomTabs(JSON.parse(tabs));
  }, []);

  const setView = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("notly_view_mode", mode);
  };

  const addCustomTab = (label: string) => {
    const id = `custom_${Date.now()}`;
    const next = [...customTabs, { id, label }];
    setCustomTabs(next);
    localStorage.setItem("notly_custom_tabs", JSON.stringify(next));
  };

  return { viewMode, setView, customTabs, addCustomTab };
}
