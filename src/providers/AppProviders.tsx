"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { getDatabase } from "@/lib/db/database";
import { syncService } from "@/lib/sync/sync-service";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AppContextValue {
  dbReady: boolean;
  user: User | null;
  isLocalMode: boolean;
  setLocalMode: (value: boolean) => void;
}

const AppContext = createContext<AppContextValue>({
  dbReady: false,
  user: null,
  isLocalMode: false,
  setLocalMode: () => {},
});

export function useApp() {
  return useContext(AppContext);
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [dbReady, setDbReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLocalMode, setLocalMode] = useState(false);

  useEffect(() => {
    getDatabase()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error("DB init failed:", err);
        setDbReady(true);
      });
  }, []);

  useEffect(() => {
    const localFlag =
      typeof window !== "undefined" &&
      localStorage.getItem("notly_local_mode") === "true";
    setLocalMode(localFlag);

    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session && !localFlag) {
        syncService.startPolling();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session && !localStorage.getItem("notly_local_mode")) {
        syncService.startPolling();
        syncService.pull();
      } else {
        syncService.stopPolling();
      }
    });

    return () => {
      subscription.unsubscribe();
      syncService.stopPolling();
    };
  }, []);

  const handleSetLocalMode = (value: boolean) => {
    setLocalMode(value);
    if (value) {
      localStorage.setItem("notly_local_mode", "true");
      syncService.stopPolling();
    } else {
      localStorage.removeItem("notly_local_mode");
      syncService.startPolling();
      syncService.pull();
    }
  };

  return (
    <AppContext.Provider
      value={{
        dbReady,
        user,
        isLocalMode,
        setLocalMode: handleSetLocalMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
