"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_PREFS, defaultWeek } from "@/domain/plan/week";
import type { Prefs, Week } from "@/domain/plan/types";
import type { Stock } from "@/domain/shop/pantry";
import { registerSavedRecipes } from "@/domain/recipes/library";
import type { Recipe } from "@/domain/recipes/types";

/**
 * Plans and preferences, saved in this browser until accounts arrive.
 * Shapes match Prep Week's so they can move to the server unchanged.
 */
type Data = { weeks: Record<string, Week>; prefs: Prefs; pantry: Record<string, Stock>; recipes: Recipe[] };

const KEY = "preppy:v1";
let data: Data | null = null;
const listeners = new Set<() => void>();

function read(): Data {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Data>;
      const d = { weeks: parsed.weeks ?? {}, prefs: { ...DEFAULT_PREFS, ...parsed.prefs }, pantry: parsed.pantry ?? {}, recipes: parsed.recipes ?? [] };
      registerSavedRecipes(d.recipes);
      return d;
    }
  } catch {}
  return { weeks: {}, prefs: DEFAULT_PREFS, pantry: {}, recipes: [] };
}

function snapshot(): Data {
  return (data ??= read());
}

function write(next: Data) {
  data = next;
  registerSavedRecipes(next.recipes);
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

export function setStock(id: string, stock: Stock) {
  const d = snapshot();
  write({ ...d, pantry: { ...d.pantry, [id]: stock } });
}

/** Tick or untick a line. Ticking a shelf item also marks it as in stock, so it stays off later lists. */
export function setBought(weekKey: string, tick: string, itemId: string | null, on: boolean) {
  const d = snapshot();
  const week = structuredClone(getWeek(d, weekKey));
  if (on) week.bought[tick] = true;
  else {
    delete week.bought[tick];
    delete week.prices[tick];
  }
  const pantry = on && itemId ? { ...d.pantry, [itemId]: "have" as Stock } : d.pantry;
  write({ ...d, pantry, weeks: { ...d.weeks, [weekKey]: week } });
}

export function setPrice(weekKey: string, tick: string, naira: number | null) {
  updateWeek(weekKey, (w) => {
    if (naira == null || Number.isNaN(naira)) delete w.prices[tick];
    else w.prices[tick] = naira;
    return w;
  });
}

export function saveRecipe(r: Recipe) {
  const d = snapshot();
  write({ ...d, recipes: [...d.recipes.filter((x) => x.id !== r.id), r] });
}

/** Removes a saved recipe and every meal that used it. Picks in rounds are dropped too. */
export function deleteRecipe(id: string) {
  const d = snapshot();
  const weeks: Record<string, Week> = {};
  for (const [k, w] of Object.entries(d.weeks)) {
    const next = structuredClone(w);
    for (const R of next.rounds) {
      R.mains = R.mains.filter((x) => x !== id);
      R.sweets = R.sweets.filter((x) => x !== id);
    }
    for (const [ck, c] of Object.entries(next.cells)) if (c.r === id) delete next.cells[ck];
    weeks[k] = next;
  }
  write({ ...d, weeks, recipes: d.recipes.filter((x) => x.id !== id) });
}
