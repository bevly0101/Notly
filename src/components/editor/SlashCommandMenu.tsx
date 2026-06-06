"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { SlashCommandItem } from "./slash-commands";

export interface SlashMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface SlashMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export const SlashCommandMenu = forwardRef<SlashMenuRef, SlashMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => setSelectedIndex(0), [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          if (items[selectedIndex]) command(items[selectedIndex]);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) return null;

    return (
      <div className="w-64 glass-panel slash-menu rounded-lg overflow-hidden z-50 border border-outline-variant/40">
        <div className="p-2 text-label-mono font-mono text-on-surface-variant border-b border-outline-variant/20">
          Basic Blocks
        </div>
        <ul className="p-1 max-h-64 overflow-y-auto">
          {items.map((item, index) => (
            <li key={item.title}>
              <button
                type="button"
                onClick={() => command(item)}
                className={`w-full text-left flex items-center px-3 py-2 rounded-md transition-colors ${
                  index === selectedIndex
                    ? "bg-surface-variant text-primary"
                    : "hover:bg-surface-variant/50 text-on-surface"
                }`}
              >
                <div className="w-8 h-8 rounded bg-background flex items-center justify-center mr-3 border border-outline-variant/20">
                  <MaterialIcon name={item.icon} size={18} />
                </div>
                <div>
                  <div className="text-body-sm font-medium">{item.title}</div>
                  <div className="text-label-mono font-mono text-on-surface-variant">
                    {item.description}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
);

SlashCommandMenu.displayName = "SlashCommandMenu";
