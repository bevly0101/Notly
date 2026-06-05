"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type LayoutContextValue = {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  panelOpen: boolean;
  setPanelOpen: (v: boolean) => void;
};

const LayoutContext = createContext<LayoutContextValue>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
  panelOpen: false,
  setPanelOpen: () => {},
});

export function useLayout() {
  return useContext(LayoutContext);
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <LayoutContext.Provider value={{ sidebarOpen, setSidebarOpen, panelOpen, setPanelOpen }}>
      {children}
    </LayoutContext.Provider>
  );
}
