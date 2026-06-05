"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import IATab from "./IATab";

const TABS = [
  { id: "ia", label: "IA" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("ia");

  return (
    <div className="h-full flex flex-col bg-surface">
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-outline-variant bg-surface-container-low">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
          >
            <Icon icon="basil:arrow-left-outline" width={18} height={18} />
          </Link>
          <h1 className="text-base font-semibold text-on-surface">
            Configurações
          </h1>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <nav className="w-48 flex-shrink-0 border-r border-outline-variant bg-surface-container-low p-2 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full px-3 py-2 text-xs text-left rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === "ia" && <IATab />}
        </main>
      </div>
    </div>
  );
}
