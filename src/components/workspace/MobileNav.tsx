"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

export function MobileNav({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname();
  const base = `/w/${workspaceId}`;

  const items = [
    { href: base, icon: "dashboard", label: "Dashboard" },
    { href: `${base}/pages`, icon: "database", label: "Pages" },
    { href: `${base}/new`, icon: "add", label: "", fab: true },
    { href: `${base}/settings`, icon: "settings", label: "Settings" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface-container border-t border-outline-variant/50 flex justify-around items-center h-16 z-50 backdrop-blur-md bg-opacity-90">
      {items.map((item) => {
        if (item.fab) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full -mt-4 relative z-10"
            >
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg border border-surface-variant">
                <MaterialIcon name="add" className="text-surface" size={24} />
              </div>
            </Link>
          );
        }
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              active ? "text-primary" : "text-on-surface-variant"
            }`}
          >
            {active ? (
              <div className="px-4 py-1 bg-surface-bright rounded-full">
                <MaterialIcon name={item.icon} filled size={24} />
              </div>
            ) : (
              <MaterialIcon name={item.icon} size={24} />
            )}
            <span className="text-[10px] font-mono">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
