"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { useLayout } from "@/lib/contexts/LayoutContext";
import TOC from "./TOC";
import AIAssistant from "./AIAssistant";

export default function RightPanel() {
  const [activeTab, setActiveTab] = useState<"toc" | "ai">("toc");
  const { panelOpen, setPanelOpen } = useLayout();

  if (!panelOpen) {
    return (
      <button
        onClick={() => setPanelOpen(true)}
        className="hidden lg:flex w-8 flex-shrink-0 items-center justify-center bg-surface-container-low border-l border-outline-variant text-on-surface-variant hover:text-primary transition-colors"
        title="Abrir painel"
      >
        <span className="text-xs rotate-90 tracking-widest font-mono uppercase">
          {activeTab === "toc" ? "Índice" : "IA"}
        </span>
      </button>
    );
  }

  return (
    <aside className="w-64 h-full flex-shrink-0 bg-surface-container-low border-l border-outline-variant flex flex-col overflow-y-auto">
      <div className="flex items-center border-b border-outline-variant">
        <button
          onClick={() => setActiveTab("toc")}
          className={`flex-1 px-3 py-2 text-xs font-medium tracking-wider uppercase transition-colors ${
            activeTab === "toc"
              ? "text-primary border-b-2 border-accent"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Índice
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex-1 px-3 py-2 text-xs font-medium tracking-wider uppercase transition-colors ${
            activeTab === "ai"
              ? "text-primary border-b-2 border-accent"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          IA
        </button>
        <button
          onClick={() => setPanelOpen(false)}
          className="px-2 py-2 text-on-surface-variant hover:text-primary transition-colors"
          title="Fechar painel"
        >
          <Icon icon="basil:cross-outline" width={14} height={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "toc" ? <TOC /> : <AIAssistant />}
      </div>
    </aside>
  );
}
