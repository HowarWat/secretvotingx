"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { GenericStringStorage } from "@/fhevm/GenericStringStorage";

/**
 * InMemoryStorage - Simple in-memory storage implementation
 */
class InMemoryStorage implements GenericStringStorage {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
  }
}

const InMemoryStorageContext = createContext<GenericStringStorage | null>(null);

export function InMemoryStorageProvider({ children }: { children: ReactNode }) {
  const storage = useMemo(() => new InMemoryStorage(), []);
  return (
    <InMemoryStorageContext.Provider value={storage}>
      {children}
    </InMemoryStorageContext.Provider>
  );
}

export function useInMemoryStorage() {
  const storage = useContext(InMemoryStorageContext);
  if (!storage) {
    throw new Error("useInMemoryStorage must be used within InMemoryStorageProvider");
  }
  return { storage };
}


