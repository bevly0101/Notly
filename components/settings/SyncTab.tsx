"use client";

import { useState, useEffect } from "react";
import { useSync } from "@/lib/contexts/SyncContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getDatabase } from "@/lib/db/database";
import { updateWorkspace } from "@/lib/db/repositories/workspace-repo";
import { syncEngine } from "@/lib/sync/sync-engine";
import AppIcon from "@/components/ui/AppIcon";
import { Icon } from "@iconify/react";
import Link from "next/link";
import type { WorkspaceDocType } from "@/lib/db/types";

export default function SyncTab() {
  const { user } = useAuth();
  const { syncStatus, lastSyncedAt, isEnabled, enableSync, disableSync, syncNow, syncWorkspace } = useSync();
  const [workspaces, setWorkspaces] = useState<WorkspaceDocType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  async function loadWorkspaces() {
    const db = await getDatabase();
    if (!db) return;
    const docs = await db.workspaces.find().exec();
    setWorkspaces(docs.map((d) => d.toMutableJSON()));
  }

  async function handleToggleWorkspace(id: string, currentOnline: boolean) {
    setLoading(true);
    const newState = !currentOnline;
    await updateWorkspace(id, { isOnline: newState });
    await syncEngine.refreshOnlineWorkspaces();
    if (newState) {
      await syncWorkspace(id);
    }
    await loadWorkspaces();
    setLoading(false);
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-on-surface mb-1">
            Sincronização
          </h3>
          <p className="text-xs text-on-surface-variant">
            Faz login para sincronizar os teus dados com a cloud.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block px-4 py-2 text-xs rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors"
        >
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-on-surface mb-1">
          Sincronização na Cloud
        </h3>
        <p className="text-xs text-on-surface-variant">
          Ativa a sincronização para enviares os teus dados para a cloud. Depois, escolhe quais workspaces sincronizar.
        </p>
      </div>

      <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-low">
        <div>
          <div className="text-sm text-on-surface font-medium">
            Sincronização automática
          </div>
          <div className="text-xs text-on-surface-variant mt-0.5">
            {syncStatus === "synced"
              ? "Tudo sincronizado"
              : syncStatus === "syncing" || syncStatus === "initial-syncing"
                ? "A sincronizar..."
                : syncStatus === "error"
                  ? "Erro de sincronização"
                  : "Sincronização desativada"}
          </div>
          {isEnabled && lastSyncedAt && (
            <div className="text-xs text-on-surface-variant mt-0.5">
              Última sincronização: {new Date(lastSyncedAt).toLocaleString("pt-PT")}
            </div>
          )}
        </div>
        <button
          onClick={isEnabled ? disableSync : enableSync}
          disabled={syncStatus === "initial-syncing"}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isEnabled ? "bg-accent" : "bg-outline-variant"
          } disabled:opacity-40`}
          role="switch"
          aria-checked={isEnabled}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              isEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {isEnabled && (
        <>
          <div>
            <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
              Workspaces
            </h4>
            <div className="space-y-2">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-low"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AppIcon icon={ws.icon} size={16} />
                    <div className="min-w-0">
                      <div className="text-sm text-on-surface truncate">
                        {ws.name}
                      </div>
                      <div className="text-xs text-on-surface-variant">
                        {ws.isOnline ? "Online" : "Offline"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        ws.isOnline
                          ? "bg-primary/10 text-primary"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      <Icon
                        icon={ws.isOnline ? "basil:cloud-outline" : "basil:cloud-slash-outline"}
                        width={12}
                        height={12}
                      />
                      {ws.isOnline ? "Online" : "Offline"}
                    </span>
                    <button
                      onClick={() => handleToggleWorkspace(ws.id, ws.isOnline)}
                      disabled={loading}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        ws.isOnline ? "bg-primary" : "bg-outline-variant"
                      } disabled:opacity-40`}
                      role="switch"
                      aria-checked={ws.isOnline}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                          ws.isOnline ? "translate-x-[18px]" : "translate-x-[2px]"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
              {workspaces.length === 0 && (
                <div className="text-xs text-on-surface-variant px-2">
                  Nenhum workspace encontrado.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={syncNow}
              disabled={syncStatus === "syncing" || syncStatus === "initial-syncing" || loading}
              className="px-4 py-2 text-xs rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-high/80 border border-outline-variant transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              <Icon icon="basil:refresh-outline" width={14} height={14} />
              Sincronizar agora
            </button>
            <span className="text-xs text-on-surface-variant">
              {user.email}
            </span>
          </div>
        </>
      )}

      <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
        <div className="text-xs text-on-surface-variant leading-relaxed">
          <strong className="text-on-surface">Nota:</strong> A sincronização usa last-write-wins. Se editares o mesmo
          documento em dois dispositivos ao mesmo tempo, a versão mais recente (por timestamp) prevalece.
        </div>
      </div>
    </div>
  );
}
