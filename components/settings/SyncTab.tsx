"use client";

import { useSync } from "@/lib/contexts/SyncContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import Link from "next/link";

export default function SyncTab() {
  const { user } = useAuth();
  const { syncStatus, lastSyncedAt, isEnabled, initialSyncProgress, enableSync, disableSync, syncNow } = useSync();

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
          Os teus dados são sincronizados com o Supabase. Alterações feitas offline serão enviadas quando houver
          conexão.
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

      {initialSyncProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>A enviar dados locais para a cloud...</span>
            <span>
              {initialSyncProgress.current}/{initialSyncProgress.total}
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{
                width: `${(initialSyncProgress.current / Math.max(initialSyncProgress.total, 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {isEnabled && (
        <div className="flex items-center gap-3">
          <button
            onClick={syncNow}
            disabled={syncStatus === "syncing" || syncStatus === "initial-syncing"}
            className="px-4 py-2 text-xs rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-high/80 border border-outline-variant transition-colors disabled:opacity-40"
          >
            Sincronizar agora
          </button>
          <span className="text-xs text-on-surface-variant">
            {user.email}
          </span>
        </div>
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
