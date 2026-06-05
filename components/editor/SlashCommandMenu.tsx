"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { SLASH_COMMANDS, type SlashCommandItem } from "@/lib/editor/slash-command";

type SlashCommandMenuProps = {
  editor: Editor;
  search: string;
  onSelect: (item: SlashCommandItem) => void;
  onClose: () => void;
};

export default function SlashCommandMenu({
  editor,
  search,
  onSelect,
  onClose,
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = SLASH_COMMANDS.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()),
  );

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSelectedIndex(0); }, [search]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        onSelect(filtered[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filtered, selectedIndex, onSelect, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-72 rounded-xl border border-outline-variant bg-surface-container-lowest/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
      style={{
        top: editor.view.coordsAtPos(editor.state.selection.from).bottom + 4,
        left: Math.min(
          editor.view.coordsAtPos(editor.state.selection.from).left,
          window.innerWidth - 300,
        ),
      }}
    >
      <div className="px-3 py-2 text-xs font-mono text-on-surface-variant border-b border-outline-variant">
        Blocos
      </div>
      <div className="max-h-64 overflow-y-auto py-1">
        {filtered.map((item, index) => (
          <button
            key={item.title}
            onClick={() => onSelect(item)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`flex items-center gap-3 w-full px-3 py-2 text-left transition-colors ${
              index === selectedIndex
                ? "bg-surface-container-high text-primary"
                : "text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container text-xs font-mono font-medium text-on-surface-variant">
              {item.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{item.title}</div>
              <div className="text-xs text-on-surface-variant truncate">
                {item.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
