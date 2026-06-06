"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/lib/types";

export function WorkspaceSidebar({
  workspace,
  onNewPage,
}: {
  workspace: Workspace;
  onNewPage?: () => void;
}) {
  const pathname = usePathname();
  const base = `/w/${workspace.id}`;

  const navItems = [
    { href: base, icon: "dashboard", label: "Dashboard" },
    { href: `${base}/settings`, icon: "settings", label: "Settings" },
  ];

  return (
    <aside className="hidden md:flex w-sidebar-width h-screen bg-surface-container border-r border-outline-variant flex-col py-4 px-3 shrink-0">
      <div className="px-2 mb-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-surface-bright flex items-center justify-center text-lg">
          {workspace.icon ?? "📁"}
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-body-sm text-primary truncate">{workspace.name}</h1>
          <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest">
            {workspace.mode === "sync" ? "Local-first Sync" : "Local only"}
          </p>
        </div>
      </div>

      <button
        onClick={onNewPage}
        className="w-full py-2.5 px-4 mb-4 bg-primary text-on-primary rounded-lg font-bold text-body-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 inner-glow"
      >
        <MaterialIcon name="add" size={18} />
        New Page
      </button>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-body-sm transition-all duration-200",
                active
                  ? "sidebar-active text-primary"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant"
              )}
            >
              <MaterialIcon name={item.icon} size={20} filled={active} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-outline-variant space-y-1">
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant text-body-sm"
        >
          <MaterialIcon name="help" size={20} />
          Help
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant text-body-sm"
        >
          <MaterialIcon name="delete" size={20} />
          Trash
        </Link>
      </div>
    </aside>
  );
}
