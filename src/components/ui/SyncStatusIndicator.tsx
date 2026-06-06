import { cn } from "@/lib/utils";
import type { SyncStatus } from "@/lib/types";

const labels: Record<SyncStatus, string> = {
  synced: "Synced",
  offline: "Local only",
  syncing: "Syncing...",
};

export function SyncStatusIndicator({
  status,
  showLabel = false,
  className,
}: {
  status: SyncStatus;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          status === "synced" && "sync-led-synced",
          status === "offline" && "sync-led-offline",
          status === "syncing" && "sync-led-syncing"
        )}
        title={labels[status]}
      />
      {showLabel && (
        <span className="text-label-mono font-mono text-on-surface-variant text-[11px]">
          {labels[status]}
        </span>
      )}
    </div>
  );
}
