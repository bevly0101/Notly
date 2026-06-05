"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TocItem = {
  level: number;
  text: string;
  id: string;
};

export default function TOC() {
  const [items, setItems] = useState<TocItem[]>([]);
  const rafRef = useRef<number | null>(null);

  const updateTOC = useCallback(() => {
    const editorEl = document.querySelector(".ProseMirror");
    if (!editorEl) return;

    const headings = editorEl.querySelectorAll("h1, h2, h3");
    const tocItems: TocItem[] = [];
    headings.forEach((h, i) => {
      const id = `heading-${i}`;
      h.id = id;
      tocItems.push({
        level: parseInt(h.tagName[1]),
        text: h.textContent ?? "",
        id,
      });
    });

    const current = items;
    if (
      current.length !== tocItems.length ||
      tocItems.some((item, i) => current[i]?.text !== item.text || current[i]?.level !== item.level)
    ) {
      setItems(tocItems);
    }
  }, [items]);

  const debouncedUpdate = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateTOC);
  }, [updateTOC]);

  useEffect(() => {
    const editorEl = document.querySelector(".ProseMirror");
    if (!editorEl) return;

    const observer = new MutationObserver(debouncedUpdate);
    observer.observe(editorEl, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    const raf = requestAnimationFrame(updateTOC);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [debouncedUpdate, updateTOC]);

  if (items.length === 0) {
    return (
      <div className="text-xs text-on-surface-variant text-center py-8">
        Sem cabeçalhos nesta página
      </div>
    );
  }

  return (
    <nav className="space-y-0.5">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="block text-xs text-on-surface-variant hover:text-primary transition-colors truncate"
          style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
        >
          {item.text}
        </a>
      ))}
    </nav>
  );
}
