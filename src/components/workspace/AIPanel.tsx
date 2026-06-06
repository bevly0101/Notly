"use client";

import { MaterialIcon } from "@/components/ui/MaterialIcon";

export function AIPanel({ className = "" }: { className?: string }) {
  return (
    <aside
      className={`w-sidebar-width h-screen bg-surface-container-low border-l border-outline-variant backdrop-blur-xl shrink-0 flex flex-col ${className}`}
    >
      <div className="p-gutter border-b border-outline-variant flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-bright flex items-center justify-center">
          <MaterialIcon name="smart_toy" className="text-primary" filled size={22} />
        </div>
        <div>
          <h4 className="text-body-sm font-bold text-primary">Contextual AI</h4>
          <p className="text-[10px] font-mono text-on-surface-variant">Notly Intelligence</p>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <div className="bg-surface-container p-3 rounded-lg text-body-sm border border-outline-variant/30">
          <p className="text-on-surface italic opacity-80">
            AI assistant will be available in Phase 3. Configure your API keys in Settings.
          </p>
        </div>
      </div>
      <div className="p-4 bg-surface-container-low border-t border-outline-variant">
        <div className="relative">
          <input
            disabled
            className="w-full bg-surface-container border-outline-variant rounded-lg py-2 px-3 text-body-sm opacity-50 pr-10"
            placeholder="Ask AI..."
          />
          <button disabled className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50">
            <MaterialIcon name="send" size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
}
