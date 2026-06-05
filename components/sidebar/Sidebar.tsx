"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { useWorkspace } from "@/lib/contexts/WorkspaceContext";
import { useLayout } from "@/lib/contexts/LayoutContext";
import { useSync } from "@/lib/contexts/SyncContext";
import type { PageDocType } from "@/lib/db/types";
import AppIcon from "@/components/ui/AppIcon";
import Link from "next/link";

export default function Sidebar() {
  const {
    workspace,
    pages,
    isReady,
    currentPageId,
    setCurrentPage,
    addNewPage,
    updatePageProp,
    deletePageById,
  } = useWorkspace();
  const { setSidebarOpen } = useLayout();
  const { syncStatus, isEnabled } = useSync();
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  function handleSelectPage(id: string) {
    setCurrentPage(id);
    setSidebarOpen(false);
  }

  const searchLower = search.toLowerCase();

  const rootPages = pages.filter(
    (p) => !p.parentId && p.title.toLowerCase().includes(searchLower),
  );
  const allFiltered = pages.filter((p) =>
    p.title.toLowerCase().includes(searchLower),
  );

  function getChildren(parentId: string): PageDocType[] {
    return allFiltered.filter((p) => p.parentId === parentId);
  }

  async function handleNewPage() {
    await addNewPage();
  }

  if (!isReady) {
    return (
      <aside className="w-[260px] h-full bg-surface-container-low border-r border-outline-variant flex flex-col items-center pt-2 transition-all duration-200">
        <div className="flex items-center justify-center h-full text-on-surface-variant text-sm">
          A inicializar...
        </div>
      </aside>
    );
  }

  if (collapsed) {
    return (
      <aside className="w-10 h-full bg-surface-container-low border-r border-outline-variant flex flex-col items-center pt-2 transition-all duration-200">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          title="Expandir"
        >
          ▶
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-[260px] h-full bg-surface-container-low border-r border-outline-variant flex flex-col overflow-y-auto transition-all duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-primary truncate">
            {workspace?.name ?? "NOTLY"}
          </h2>
          {workspace && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                syncStatus === "syncing" || syncStatus === "initial-syncing"
                  ? "bg-accent/15 text-accent"
                  : workspace.isOnline && syncStatus === "synced"
                    ? "bg-primary/10 text-primary"
                    : workspace.isOnline && syncStatus === "error"
                      ? "bg-error/10 text-error"
                      : "bg-surface-container-high text-on-surface-variant"
              }`}
              title={
                syncStatus === "syncing" || syncStatus === "initial-syncing"
                  ? "A sincronizar..."
                  : workspace.isOnline
                    ? "Online"
                    : "Offline"
              }
            >
              {syncStatus === "syncing" || syncStatus === "initial-syncing" ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
                  Sync
                </>
              ) : (
                <Icon
                  icon={
                    workspace.isOnline
                      ? "basil:cloud-outline"
                      : "basil:cloud-slash-outline"
                  }
                  width={10}
                  height={10}
                />
              )}
              <span className="hidden sm:inline">
                {syncStatus === "syncing" || syncStatus === "initial-syncing"
                  ? ""
                  : workspace.isOnline
                    ? "Online"
                    : "Offline"}
              </span>
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          title="Colapsar"
        >
          ◀
        </button>
      </div>

      <div className="px-2 pt-3 pb-2">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Pesquisar páginas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant outline-none ring-1 ring-outline-variant focus:ring-accent transition-shadow"
          />
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-0.5">
        {rootPages.length === 0 && (
          <div className="px-2 py-4 text-xs text-on-surface-variant text-center">
            {search ? "Nenhuma página encontrada" : "Nenhuma página ainda"}
          </div>
        )}
        {rootPages.map((page) => (
          <PageTree
            key={page.id}
            page={page}
            depth={0}
            activeId={currentPageId}
            onSelect={handleSelectPage}
            addNewPage={addNewPage}
            updatePageProp={updatePageProp}
            deletePageById={deletePageById}
            getChildren={getChildren}
          />
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-outline-variant space-y-1">
        <button
          onClick={handleNewPage}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <span className="text-base">+</span>
          <span>Nova página</span>
        </button>

        <Link
          href="/settings"
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <Icon icon="basil:settings-outline" width={14} height={14} />
          <span>Configurações</span>
        </Link>

        <div className="flex items-center gap-2 px-2 py-1.5 text-xs">
          {isEnabled ? (
            <>
              {syncStatus === "syncing" || syncStatus === "initial-syncing" ? (
                <span className="flex items-center gap-1.5 text-accent">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  A sincronizar...
                </span>
              ) : syncStatus === "error" ? (
                <span className="flex items-center gap-1.5 text-error">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-error" />
                  Erro de sync
                </span>
              ) : syncStatus === "synced" ? (
                <span className="flex items-center gap-1.5 text-primary">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                  Sincronizado
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-on-surface-variant" />
                  Sync inativo
                </span>
              )}
            </>
          ) : (
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-on-surface-variant" />
              Desconectado
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}

function PageTree({
  page,
  depth,
  activeId,
  onSelect,
  addNewPage,
  updatePageProp,
  deletePageById,
  getChildren,
}: {
  page: PageDocType;
  depth: number;
  activeId: string | null;
  onSelect: (id: string) => void;
  addNewPage: (parentId?: string) => Promise<PageDocType | null>;
  updatePageProp: (id: string, props: Partial<PageDocType>) => Promise<void>;
  deletePageById: (id: string) => Promise<void>;
  getChildren: (parentId: string) => PageDocType[];
}) {
  const [expanded, setExpanded] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const children = getChildren(page.id);

  async function handleToggleFav(e: React.MouseEvent) {
    e.stopPropagation();
    await updatePageProp(page.id, { isFavorite: !page.isFavorite });
    setMenuOpen(false);
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm(`Eliminar "${page.title}"?`)) {
      await deletePageById(page.id);
    }
    setMenuOpen(false);
  }

  function handleDuplicate(e: React.MouseEvent) {
    e.stopPropagation();
    addNewPage();
    setMenuOpen(false);
  }

  async function handleAddSubPage(e: React.MouseEvent) {
    e.stopPropagation();
    await addNewPage(page.id);
    setMenuOpen(false);
  }

  return (
    <div>
      <div
        className={`group flex items-center gap-1 w-full pr-1 py-1.5 rounded-md text-sm text-left transition-colors cursor-pointer ${
          page.id === activeId
            ? "bg-accent/10 text-accent"
            : "text-on-surface hover:bg-surface-container-high"
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelect(page.id)}
      >
        {children.length > 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 text-xs text-on-surface-variant hover:text-on-surface flex-shrink-0"
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        <span className="flex-shrink-0 flex items-center">
          <AppIcon icon={page.icon} size={16} />
        </span>
        <span className="truncate flex-1">{page.title}</span>

        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 rounded text-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-surface-container transition-all text-on-surface-variant hover:text-on-surface"
          >
            <Icon icon="basil:other-1-outline" width={14} height={14} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1 z-50 w-44 rounded-lg border border-outline-variant bg-surface-container-lowest shadow-xl py-1">
                <button
                  onClick={handleToggleFav}
                  className="w-full px-3 py-1.5 text-xs text-left text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
                >
                  <Icon icon={page.isFavorite ? "basil:star-outline" : "basil:star-solid"} width={14} height={14} />
                  <span>{page.isFavorite ? "Remover favorito" : "Favoritar"}</span>
                </button>
                <button
                  onClick={handleAddSubPage}
                  className="w-full px-3 py-1.5 text-xs text-left text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
                >
                  <Icon icon="basil:book-open-outline" width={14} height={14} />
                  <span>Nova sub-página</span>
                </button>
                <button
                  onClick={handleDuplicate}
                  className="w-full px-3 py-1.5 text-xs text-left text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
                >
                  <Icon icon="basil:copy-outline" width={14} height={14} />
                  <span>Duplicar</span>
                </button>
                <hr className="my-1 border-outline-variant" />
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-1.5 text-xs text-left text-error hover:bg-surface-container transition-colors flex items-center gap-2"
                >
                  <Icon icon="basil:trash-outline" width={14} height={14} />
                  <span>Eliminar</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {expanded && children.map((child) => (
        <PageTree
          key={child.id}
          page={child}
          depth={depth + 1}
          activeId={activeId}
          onSelect={onSelect}
          addNewPage={addNewPage}
          updatePageProp={updatePageProp}
          deletePageById={deletePageById}
          getChildren={getChildren}
        />
      ))}
    </div>
  );
}
