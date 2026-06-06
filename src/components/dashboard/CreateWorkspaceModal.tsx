"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { WorkspaceMode } from "@/lib/types";

export function CreateWorkspaceModal({
  open,
  onClose,
  onCreate,
  canSync,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, mode: WorkspaceMode, icon: string) => void;
  canSync: boolean;
}) {
  const [name, setName] = useState("");
  const [mode, setMode] = useState<WorkspaceMode>(canSync ? "sync" : "local");
  const [icon, setIcon] = useState("📁");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), mode, icon);
    setName("");
    setIcon("📁");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-headline-md text-primary font-semibold">New Workspace</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary">
            <MaterialIcon name="close" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-label-mono font-mono text-on-surface-variant uppercase mb-1.5">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface border border-outline-variant/30 rounded-lg py-2.5 px-4 text-primary focus:border-secondary focus:outline-none"
              placeholder="My Workspace"
              required
            />
          </div>
          <div>
            <label className="block text-label-mono font-mono text-on-surface-variant uppercase mb-1.5">
              Icon
            </label>
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full bg-surface border border-outline-variant/30 rounded-lg py-2.5 px-4 text-2xl focus:border-secondary focus:outline-none"
              maxLength={4}
            />
          </div>
          <div>
            <label className="block text-label-mono font-mono text-on-surface-variant uppercase mb-1.5">
              Mode
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("local")}
                className={`flex-1 py-2 rounded-lg text-body-sm font-bold border transition-colors ${
                  mode === "local"
                    ? "bg-primary text-on-primary border-primary"
                    : "border-outline-variant/30 text-on-surface-variant"
                }`}
              >
                Local
              </button>
              <button
                type="button"
                onClick={() => canSync && setMode("sync")}
                disabled={!canSync}
                className={`flex-1 py-2 rounded-lg text-body-sm font-bold border transition-colors ${
                  mode === "sync"
                    ? "bg-secondary-container text-on-secondary-container border-secondary-container"
                    : "border-outline-variant/30 text-on-surface-variant disabled:opacity-40"
                }`}
              >
                Sync
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-on-primary py-3 rounded-lg font-semibold hover:opacity-90 inner-glow"
          >
            Create Workspace
          </button>
        </form>
      </div>
    </div>
  );
}
