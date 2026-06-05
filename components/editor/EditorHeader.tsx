"use client";

import { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useWorkspace } from "@/lib/contexts/WorkspaceContext";
import { useLayout } from "@/lib/contexts/LayoutContext";
import { PAGE_ICONS } from "@/lib/icons";
import AppIcon from "@/components/ui/AppIcon";
import Link from "next/link";

export default function EditorHeader() {
  const {
    pages,
    workspace,
    currentPageId,
    isMemory,
    updatePageProp,
    deletePageById,
    addNewPage,
  } = useWorkspace();
  const { setSidebarOpen, setPanelOpen } = useLayout();
  const [menuOpen, setMenuOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);

  const currentPage = pages.find((p) => p.id === currentPageId) ?? null;

  async function handleToggleFav() {
    if (!currentPage) return;
    await updatePageProp(currentPage.id, {
      isFavorite: !currentPage.isFavorite,
    });
  }

  async function handleDelete() {
    if (!currentPage) return;
    if (confirm(`Eliminar "${currentPage.title}"?`)) {
      await deletePageById(currentPage.id);
    }
    setMenuOpen(false);
  }

  async function handleDuplicate() {
    if (!currentPage || !workspace) return;
    await addNewPage();
    setMenuOpen(false);
  }

  function handleExport() {
    if (!currentPage) return;
    const blob = new Blob(
      [`# ${currentPage.title}\n\nExportado de NOTLY`],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentPage.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  }

  async function handleIconSelect(iconName: string) {
    if (!currentPage) return;
    await updatePageProp(currentPage.id, { icon: iconName });
    setIconPickerOpen(false);
  }

  return (
    <header className="flex items-center justify-between px-2 sm:px-4 py-2 border-b border-outline-variant bg-surface-container-low gap-1">
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container transition-colors md:hidden flex-shrink-0"
          title="Abrir sidebar"
        >
          <Icon icon="basil:menu-outline" width={20} height={20} />
        </button>

        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono tracking-wider truncate">
          <Link href="/" className="hover:text-primary transition-colors hidden sm:inline">
            NOTLY
          </Link>
          {workspace && (
            <>
              <span className="text-outline hidden sm:inline">/</span>
              <span className="text-on-surface truncate max-w-[120px] sm:max-w-none">
                {workspace.name}
              </span>
            </>
          )}
          {currentPage && (
            <>
              <span className="text-outline">/</span>
              <span className="text-on-surface truncate max-w-[120px] sm:max-w-[200px]">
                {currentPage.title}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <div className="relative">
          <button
            onClick={() => setIconPickerOpen(!iconPickerOpen)}
            className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container transition-colors"
            title="Alterar ícone"
          >
            <AppIcon icon={currentPage?.icon} size={18} />
          </button>
          {iconPickerOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIconPickerOpen(false)}
              />
              <div
                ref={iconPickerRef}
                className="absolute right-0 top-full mt-1 z-50 w-[360px] rounded-lg border border-outline-variant bg-surface-container-lowest shadow-xl p-2"
              >
                <div className="grid grid-cols-8 gap-1 max-h-[280px] overflow-y-auto">
                  {PAGE_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      onClick={() => handleIconSelect(iconName)}
                      className={`p-1.5 rounded-md hover:bg-surface-container transition-colors flex items-center justify-center ${
                        currentPage?.icon === iconName
                          ? "bg-accent/10 ring-1 ring-accent"
                          : ""
                      }`}
                    >
                      <AppIcon icon={iconName} size={18} />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={handleToggleFav}
          className={`p-1.5 rounded-md transition-colors ${
            currentPage?.isFavorite
              ? "text-secondary"
              : "text-on-surface-variant hover:text-primary"
          }`}
          title={currentPage?.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          <Icon
            icon={currentPage?.isFavorite ? "basil:star-solid" : "basil:star-outline"}
            width={16}
            height={16}
          />
        </button>

        <span className="hidden sm:flex items-center gap-1.5 text-xs text-on-surface-variant">
          <Icon
            icon={isMemory ? "basil:info-circle-outline" : "basil:cloud-outline"}
            width={12}
            height={12}
          />
          {isMemory ? "Memória" : "Offline"}
        </span>

        <button
          onClick={() => setPanelOpen(true)}
          className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container transition-colors lg:hidden"
          title="Abrir painel"
        >
          <Icon icon="basil:layout-outline" width={16} height={16} />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
          >
            <Icon icon="basil:more-outline" width={16} height={16} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-outline-variant bg-surface-container-lowest shadow-xl py-1">
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full px-3 py-1.5 text-xs text-left text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
                >
                  <Icon icon="basil:history-outline" width={14} height={14} />
                  Histórico de versões
                </button>
                <button
                  onClick={handleExport}
                  className="w-full px-3 py-1.5 text-xs text-left text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
                >
                  <Icon icon="basil:download-outline" width={14} height={14} />
                  Exportar
                </button>
                <button
                  onClick={handleDuplicate}
                  className="w-full px-3 py-1.5 text-xs text-left text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
                >
                  <Icon icon="basil:copy-outline" width={14} height={14} />
                  Duplicar
                </button>
                <hr className="my-1 border-outline-variant" />
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-1.5 text-xs text-left text-error hover:bg-surface-container transition-colors flex items-center gap-2"
                >
                  <Icon icon="basil:trash-outline" width={14} height={14} />
                  Eliminar página
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
