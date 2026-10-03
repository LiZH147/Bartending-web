"use client";

import { useCallback, useEffect, useState } from "react";

function loadList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    /* ignore */
  }
  return [];
}

function saveList(key: string, value: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function useLocalStorageList(key: string) {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    setItems(loadList(key));
  }, [key]);

  const set = useCallback(
    (updater: (prev: string[]) => string[]) => {
      setItems((prev) => {
        const next = updater(prev);
        saveList(key, next);
        return next;
      });
    },
    [key],
  );

  const add = useCallback((id: string) => set((p) => (p.includes(id) ? p : [...p, id])), [set]);
  const remove = useCallback((id: string) => set((p) => p.filter((x) => x !== id)), [set]);
  const toggle = useCallback(
    (id: string) => set((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
    [set],
  );
  const replaceAll = useCallback((ids: string[]) => set(() => ids), [set]);
  const clear = useCallback(() => set(() => []), [set]);

  return { items, set, add, remove, toggle, replaceAll, clear, has: (id: string) => items.includes(id) };
}

export function useCabinet() {
  return useLocalStorageList("nightcap:cabinet");
}

export function useFavorites() {
  return useLocalStorageList("nightcap:favorites");
}

export type CabinetStore = ReturnType<typeof useCabinet>;
export type FavoritesStore = ReturnType<typeof useFavorites>;