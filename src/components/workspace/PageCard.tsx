"use client";

import Link from "next/link";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { relativeTime } from "@/lib/utils";
import type { Page } from "@/lib/types";

export function PageCard({
  page,
  workspaceId,
}: {
  page: Page;
  workspaceId: string;
}) {
  return (
    <Link
      href={`/w/${workspaceId}/p/${page.id}`}
      className="glass-card rounded-2xl overflow-hidden flex flex-col h-[280px] group"
    >
      <div className="h-32 bg-surface-container-highest relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-container/80" />
        <div className="p-4 text-5xl opacity-40">{page.icon ?? "📄"}</div>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-bold text-primary truncate">{page.title}</h4>
          </div>
          <p className="text-[11px] text-on-surface-variant font-mono uppercase">
            Edited {relativeTime(page.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {page.isFavorite && (
            <span className="px-2 py-0.5 bg-secondary/20 text-secondary text-[10px] rounded">
              Pinned
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CreatePageCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="glass-card rounded-2xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-3 h-[280px] hover:border-secondary transition-all group"
    >
      <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
        <MaterialIcon name="add" className="text-secondary" size={32} />
      </div>
      <span className="font-bold text-primary">Create New</span>
    </button>
  );
}
