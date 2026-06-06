"use client";

import Link from "next/link";
import { useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import type { Page } from "@/lib/types";

function buildTree(pages: Page[]): Map<string | null, Page[]> {
  const map = new Map<string | null, Page[]>();
  for (const page of pages) {
    const key = page.parentId;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(page);
  }
  return map;
}

function TreeNode({
  page,
  workspaceId,
  tree,
  currentPageId,
  depth = 0,
}: {
  page: Page;
  workspaceId: string;
  tree: Map<string | null, Page[]>;
  currentPageId: string;
  depth?: number;
}) {
  const children = tree.get(page.id) ?? [];
  const [expanded, setExpanded] = useState(true);
  const isActive = page.id === currentPageId;

  return (
    <div>
      <div
        className={`group flex items-center justify-between py-1 cursor-pointer ${
          isActive ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
        }`}
        style={{ paddingLeft: depth * 16 }}
      >
        <div className="flex items-center min-w-0 flex-1">
          {children.length > 0 ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mr-1 opacity-50 hover:opacity-100"
            >
              <MaterialIcon
                name="arrow_drop_down"
                size={14}
                className={expanded ? "" : "-rotate-90"}
              />
            </button>
          ) : (
            <MaterialIcon name="description" size={14} className="mr-2 opacity-50" />
          )}
          <Link
            href={`/w/${workspaceId}/p/${page.id}`}
            className="text-body-sm truncate"
          >
            {page.title}
          </Link>
        </div>
      </div>
      {expanded &&
        children.map((child) => (
          <TreeNode
            key={child.id}
            page={child}
            workspaceId={workspaceId}
            tree={tree}
            currentPageId={currentPageId}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}

export function PageTree({
  pages,
  workspaceId,
  currentPageId,
}: {
  pages: Page[];
  workspaceId: string;
  currentPageId: string;
}) {
  const tree = buildTree(pages);
  const roots = tree.get(null) ?? [];

  return (
    <div className="pl-2 pr-2 space-y-1 py-1">
      {roots.map((page) => (
        <TreeNode
          key={page.id}
          page={page}
          workspaceId={workspaceId}
          tree={tree}
          currentPageId={currentPageId}
        />
      ))}
    </div>
  );
}
