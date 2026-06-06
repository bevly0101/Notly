"use client";

import Link from "next/link";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { SyncStatusIndicator } from "@/components/ui/SyncStatusIndicator";
import { formatDate } from "@/lib/utils";
import type { Workspace } from "@/lib/types";

export function WorkspaceCard({
  workspace,
  viewMode = "grid",
}: {
  workspace: Workspace;
  viewMode?: "grid" | "list";
}) {
  const icon = workspace.icon ?? "📁";

  if (viewMode === "list") {
    return (
      <Link
        href={`/w/${workspace.id}`}
        className="glass-card rounded-xl p-4 flex items-center gap-4 group"
      >
        <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-2xl">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-primary truncate">{workspace.name}</h4>
            <SyncStatusIndicator status={workspace.status} />
          </div>
          <p className="text-[11px] text-on-surface-variant font-mono uppercase">
            {formatDate(workspace.lastEdited)} · {workspace.mode.toUpperCase()}
          </p>
        </div>
        <MaterialIcon
          name="chevron_right"
          className="text-on-surface-variant group-hover:text-primary"
        />
      </Link>
    );
  }

  return (
    <Link href={`/w/${workspace.id}`} className="glass-card rounded-2xl overflow-hidden flex flex-col h-[280px] group">
      <div className="h-32 bg-surface-container-highest relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-container/80" />
        <div className="p-4 text-5xl opacity-60">{icon}</div>
        <div className="absolute top-3 right-3">
          <SyncStatusIndicator status={workspace.status} />
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-primary truncate">{workspace.name}</h4>
          <p className="text-[11px] text-on-surface-variant font-mono uppercase mt-1">
            Edited {formatDate(workspace.lastEdited)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="px-2 py-0.5 bg-surface-variant text-on-surface-variant text-[10px] rounded uppercase">
            {workspace.mode}
          </span>
        </div>
      </div>
    </Link>
  );
}
