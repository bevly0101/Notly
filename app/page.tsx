"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { createDatabase } from "@/lib/db";
import { getAllWorkspaces, createWorkspace, deleteWorkspace } from "@/lib/db/repositories/workspace-repo";
import { WORKSPACE_ICONS } from "@/lib/icons";
import AppIcon from "@/components/ui/AppIcon";
import type { WorkspaceDocType } from "@/lib/db/types";
import Link from "next/link";

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceDocType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("folder-outline");

  useEffect(() => {
    async function load() {
      try {
        await createDatabase();
        const ws = await getAllWorkspaces();
        setWorkspaces(ws.map((w) => w.toMutableJSON()));
      } catch (err) {
        console.error("Failed to load workspaces:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      const ws = await createWorkspace({ name: newName.trim(), icon: newIcon });
      setWorkspaces((prev) => [...prev, ws.toMutableJSON()]);
      setShowModal(false);
      setNewName("");
      setNewIcon("folder-outline");
      router.push(`/workspace/${ws.id}`);
    } catch (err) {
      console.error("Failed to create workspace:", err);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.stopPropagation();
    if (confirm(`Eliminar workspace "${name}"? Todas as páginas serão perdidas.`)) {
      await deleteWorkspace(id);
      setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-on-surface-variant text-sm">A carregar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
        <h1 className="text-xl font-bold text-primary tracking-tight">NOTLY</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
          >
            + Novo Workspace
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant hidden sm:inline">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant text-on-surface-variant hover:text-error hover:border-error transition-colors"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
            >
              Entrar
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        {workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="mb-4 opacity-60">
              <Icon icon="basil:folder-outline" width={48} height={48} />
            </span>
            <h2 className="text-lg font-semibold text-on-surface mb-2">
              Nenhum workspace ainda
            </h2>
            <p className="text-sm text-on-surface-variant mb-6">
              Cria o teu primeiro workspace para começar a organizar as tuas notas.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
            >
              + Criar Workspace
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {workspaces
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => router.push(`/workspace/${ws.id}`)}
                  className="group flex items-center gap-4 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8">
                    <AppIcon icon={ws.icon} size={24} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-on-surface truncate">
                      {ws.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Criado a {new Date(ws.createdAt).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, ws.id, ws.name)}
                    className="p-1.5 rounded-md text-on-surface-variant hover:text-error hover:bg-surface-container opacity-0 group-hover:opacity-100 transition-all"
                    title="Eliminar workspace"
                  >
                    <Icon icon="basil:trash-outline" width={16} height={16} />
                  </button>
                </div>
              ))}
          </div>
        )}
      </main>

      {showModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setShowModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-xl border border-outline-variant bg-surface-container-lowest shadow-xl p-6">
              <h2 className="text-base font-semibold text-on-surface mb-4">
                Novo Workspace
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Meu Workspace"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant outline-none ring-1 ring-outline-variant focus:ring-accent transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                    Ícone
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {WORKSPACE_ICONS.map((iconName) => (
                      <button
                        key={iconName}
                        onClick={() => setNewIcon(iconName)}
                        className={`p-2 rounded-lg hover:bg-surface-container transition-colors flex items-center justify-center ${
                          newIcon === iconName
                            ? "bg-accent/10 ring-1 ring-accent"
                            : ""
                        }`}
                      >
                        <AppIcon icon={iconName} size={22} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Criar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
