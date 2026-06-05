"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { syncEngine } from "@/lib/sync/sync-engine";
import { supabase } from "@/lib/supabase/client";
import { waitForDatabase } from "@/lib/db/database";
import type { SyncStatus, InitialSyncProgress } from "@/lib/sync/types";

const LS_SYNC_ENABLED = "notly_sync_enabled";

type SyncContextValue = {
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  isEnabled: boolean;
  initialSyncProgress: InitialSyncProgress | null;
  enableSync: () => Promise<void>;
  disableSync: () => void;
  syncNow: () => Promise<void>;
  syncWorkspace: (workspaceId: string) => Promise<void>;
};

const SyncContext = createContext<SyncContextValue>({
  syncStatus: "idle",
  lastSyncedAt: null,
  isEnabled: false,
  initialSyncProgress: null,
  enableSync: async () => {},
  disableSync: () => {},
  syncNow: async () => {},
  syncWorkspace: async () => {},
});

export function useSync() {
  return useContext(SyncContext);
}

function loadSyncEnabled(): boolean {
  try {
    return localStorage.getItem(LS_SYNC_ENABLED) === "true";
  } catch {
    return false;
  }
}

function saveSyncEnabled(v: boolean) {
  try {
    localStorage.setItem(LS_SYNC_ENABLED, v ? "true" : "false");
  } catch {}
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [isEnabled, setIsEnabled] = useState(loadSyncEnabled);
  const [initialSyncProgress, setInitialSyncProgress] = useState<InitialSyncProgress | null>(null);
  const autoStarted = useRef(false);

  useEffect(() => {
    const unsubStatus = syncEngine.onStatusChange(setSyncStatus);
    const unsubProgress = syncEngine.onInitialSyncProgress(setInitialSyncProgress);
    return () => {
      unsubStatus();
      unsubProgress();
    };
  }, []);

  // Auto-start sync after login if it was enabled before page refresh
  useEffect(() => {
    if (user && isEnabled && !autoStarted.current && !syncEngine.isRunning) {
      autoStarted.current = true;
      (async () => {
        try {
          const db = await waitForDatabase();
          syncEngine.setDatabase(db);
          syncEngine.setSupabase(supabase);
          await syncEngine.start();
          setLastSyncedAt(Date.now());
        } catch (err) {
          console.error("[Sync] Auto-start failed:", err);
          autoStarted.current = false;
        }
      })();
    }
  }, [user, isEnabled]);

  const enableSync = useCallback(async () => {
    if (!user) return;

    const db = await waitForDatabase();
    syncEngine.setDatabase(db);
    syncEngine.setSupabase(supabase);

    await syncEngine.start();

    setIsEnabled(true);
    saveSyncEnabled(true);
    setLastSyncedAt(Date.now());
  }, [user]);

  const disableSync = useCallback(() => {
    syncEngine.stop();
    setIsEnabled(false);
    saveSyncEnabled(false);
    setInitialSyncProgress(null);
    autoStarted.current = false;
  }, []);

  const syncNow = useCallback(async () => {
    await syncEngine.syncNow();
    setLastSyncedAt(syncEngine.lastSyncedAt);
  }, []);

  const syncWorkspace = useCallback(async (workspaceId: string) => {
    if (!syncEngine.isRunning) {
      await enableSync();
    }
    await syncEngine.syncWorkspace(workspaceId);
    setLastSyncedAt(syncEngine.lastSyncedAt);
  }, [enableSync]);

  return (
    <SyncContext.Provider
      value={{ syncStatus, lastSyncedAt, isEnabled, initialSyncProgress, enableSync, disableSync, syncNow, syncWorkspace }}
    >
      {children}
    </SyncContext.Provider>
  );
}
