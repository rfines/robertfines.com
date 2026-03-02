"use client";

import {
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "retold-sidebar-collapsed";

// External store to avoid setState-in-effect
let sidebarListeners: Array<() => void> = [];
let collapsedState = false;

if (typeof window !== "undefined") {
  try {
    collapsedState = localStorage.getItem(STORAGE_KEY) === "true";
  } catch {}
}

function getSnapshot() {
  return collapsedState;
}

function getServerSnapshot() {
  return false;
}

function subscribeSidebar(listener: () => void) {
  sidebarListeners = [...sidebarListeners, listener];
  return () => {
    sidebarListeners = sidebarListeners.filter((l) => l !== listener);
  };
}

function setCollapsedExternal(value: boolean) {
  collapsedState = value;
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {}
  for (const listener of sidebarListeners) listener();
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const collapsed = useSyncExternalStore(
    subscribeSidebar,
    getSnapshot,
    getServerSnapshot
  );

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedExternal(value);
  }, []);

  const toggle = useCallback(() => {
    setCollapsedExternal(!collapsedState);
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
