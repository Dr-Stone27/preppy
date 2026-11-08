"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_PREFS, defaultWeek } from "@/domain/plan/week";
import type { Prefs, Week } from "@/domain/plan/types";

/**
 * Plans and preferences, saved in this browser until accounts arrive.
 * Shapes match Prep Week's so they can move to the server unchanged.
 */
type Data = { weeks: Record<string, Week>; prefs: Prefs };

const KEY = "preppy:v1";
let data: Data | null = null;
const listeners = new Set<() => void>();

function read(): Data {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Data>;
      return { weeks: parsed.weeks ?? {}, prefs: { ...DEFAULT_PREFS, ...parsed.prefs } };
    }
  } catch {}
  return { weeks: {}, prefs: DEFAULT_PREFS };
}

function snapshot(): Data {
  return (data ??= read());
}

function write(next: Data) {
  data = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      data = read();
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

/** Null on the server and during the first render, so nothing date- or storage-dependent is prerendered. */
export function useData(): Data | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

export function getWeek(d: Data, key: string): Week {
  return d.weeks[key] ?? defaultWeek();
}

export function updateWeek(key: string, fn: (w: Week) => Week) {
  const d = snapshot();
  write({ ...d, weeks: { ...d.weeks, [key]: fn(structuredClone(getWeek(d, key))) } });
}

export function updatePrefs(fn: (p: Prefs) => Prefs) {
  const d = snapshot();
  write({ ...d, prefs: fn({ ...d.prefs }) });
}
