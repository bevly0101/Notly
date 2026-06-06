"use client";

import { MaterialIcon } from "@/components/ui/MaterialIcon";

export function ViewToggle({
  viewMode,
  onChange,
}: {
  viewMode: "grid" | "list";
  onChange: (mode: "grid" | "list") => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange("grid")}
        className={`p-2 rounded-lg transition-colors ${
          viewMode === "grid"
            ? "bg-surface-container-high text-primary"
            : "hover:bg-surface-container text-on-surface-variant"
        }`}
        title="Grid view"
      >
        <MaterialIcon name="grid_view" size={20} />
      </button>
      <button
        onClick={() => onChange("list")}
        className={`p-2 rounded-lg transition-colors ${
          viewMode === "list"
            ? "bg-surface-container-high text-primary"
            : "hover:bg-surface-container text-on-surface-variant"
        }`}
        title="List view"
      >
        <MaterialIcon name="list" size={20} />
      </button>
    </div>
  );
}
