"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useMemo } from "react";
import type { AdminCapability } from "@/types/admin";

interface AdminCapabilitiesContextValue {
  capabilities: AdminCapability[];
  keys: Set<string>;
  hasCapability: (key: string) => boolean;
}

const AdminCapabilitiesContext = createContext<AdminCapabilitiesContextValue | null>(null);

export function AdminCapabilitiesProvider({
  capabilities,
  children,
}: {
  capabilities: AdminCapability[];
  children: ReactNode;
}) {
  const value = useMemo<AdminCapabilitiesContextValue>(() => {
    const keys = new Set(capabilities.map((c) => c.key));
    return {
      capabilities,
      keys,
      hasCapability: (key: string) => keys.has(key),
    };
  }, [capabilities]);

  return (
    <AdminCapabilitiesContext.Provider value={value}>
      {children}
    </AdminCapabilitiesContext.Provider>
  );
}

export function useAdminCapabilities() {
  const ctx = useContext(AdminCapabilitiesContext);
  if (!ctx) {
    throw new Error("useAdminCapabilities must be used within AdminCapabilitiesProvider");
  }
  return ctx;
}

