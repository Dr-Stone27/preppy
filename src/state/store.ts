"use client";

import { useSyncExternalStore } from "react";
import { weekStartFromKey } from "@/domain/plan/dates";
import { cellKey, DEFAULT_PREFS, defaultWeek, fillCells, SLOTS } from "@/domain/plan/week";
import type { Extra, Prefs, Week } from "@/domain/plan/types";
import type { Stock } from "@/domain/shop/pantry";
import { recipeById, registerSavedRecipes } from "@/domain/recipes/library";
import type { Recipe } from "@/domain/recipes/types";

/**
 * Plans, preferences, pantry stock and the user's own recipes.
 * Always saved in this browser; when signed in, sync.ts copies every change to the account.
 */
export type Data = { weeks: Record<string, Week>; prefs: Prefs; pantry: Record<string, Stock>; recipes: Recipe[] };

const KEY = "preppy:v1";
let data: Data | null = null;
const listeners = new Set<() => void>();

const writeHooks = new Set<(d: Data) => void>();

export function normalise(parsed: Partial<Data> | null | undefined): Data {
  return { weeks: parsed?.weeks ?? {}, prefs: { ...DEFAULT_PREFS, ...parsed?.prefs }, pantry: parsed?.pantry ?? {}, recipes: parsed?.recipes ?? [] };
}

function read(): Data {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = normalise(JSON.parse(raw) as Partial<Data>);
      registerSavedRecipes(d.recipes);
      return d;
    }
  } catch {}
  return normalise(null);
}

function snapshot(): Data {
  return (data ??= read());
}

function write(next: Data, fromUser = true) {
  data = next;
  registerSavedRecipes(next.recipes);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
  if (fromUser) writeHooks.forEach((h) => h(next));
}

/** Called after every change the user makes (not after replaceData). Returns an unsubscribe. */
export function onUserWrite(h: (d: Data) => void) {
  writeHooks.add(h);
  return () => void writeHooks.delete(h);
}

export function currentData(): Data {
  return snapshot();
}

/** Swap in data from the account. Doesn't count as a user change. */
export function replaceData(d: Data) {
  write(normalise(d), false);
}

/** True when nothing has been saved on this device yet. */
export function isEmpty(d: Data) {
  return !Object.keys(d.weeks).length && !Object.keys(d.pantry).length && !d.recipes.length && !d.prefs.onboarded;
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
  return d.weeks[key] ?? defaultWeek(d.prefs, weekStartFromKey(key));
}

export function updateWeek(key: string, fn: (w: Week) => Week) {
  const d = snapshot();
  write({ ...d, weeks: { ...d.weeks, [key]: fn(structuredClone(getWeek(d, key))) } });
}

export function updatePrefs(fn: (p: Prefs) => Prefs) {
  const d = snapshot();
  write({ ...d, prefs: fn({ ...d.prefs }) });
}

/**
 * Copies last week's planned cooks into a week that has none planned, cook for cook in order, and fills the timetable.
 * Shopping ticks, cook orders and hand-made changes aren't copied. Returns how many cooks were copied.
 */
export function repeatWeek(fromKey: string, toKey: string): number {
  const d = snapshot();
  const from = d.weeks[fromKey];
  if (!from) return 0;
  let n = 0;
  updateWeek(toKey, (w) => {
    w.rounds.forEach((r, i) => {
      const src = from.rounds[i];
      if (!src?.confirmed || r.confirmed) return;
      r.mains = src.mains.filter((id) => recipeById(id));
      r.sweets = src.sweets.filter((id) => recipeById(id));
      if (!r.mains.length) return;
      r.confirmed = true;
      for (const day of r.days) for (const s of SLOTS) delete w.cells[cellKey(day, s.id)];
      Object.assign(w.cells, fillCells(r, r.mains, r.sweets, d.prefs.bases));
      n++;
    });
    return w;
  });
  return n;
}

const MAX_EXTRAS = 100;

/** A fresh id for something added to a list by hand. */
export const newExtraId = () => `x${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Adds your own item to a round's shopping list. Returns false if it's a duplicate or the list is full. */
export function addExtra(weekKey: string, roundId: string, extra: Extra): boolean {
  let added = false;
  updateWeek(weekKey, (w) => {
    const r = w.rounds.find((x) => x.id === roundId);
    if (!r) return w;
    const list = (r.extras ??= []);
    if (list.length >= MAX_EXTRAS || list.some((e) => e.name.toLowerCase() === extra.name.toLowerCase())) return w;
    list.push(extra);
    added = true;
    return w;
  });
  return added;
}

export function setExtraDone(weekKey: string, roundId: string, id: string, done: boolean) {
  updateWeek(weekKey, (w) => {
    const e = w.rounds.find((x) => x.id === roundId)?.extras?.find((x) => x.id === id);
    if (e) e.done = done || undefined;
    return w;
  });
}

export function removeExtra(weekKey: string, roundId: string, id: string) {
  updateWeek(weekKey, (w) => {
    const r = w.rounds.find((x) => x.id === roundId);
    if (r?.extras) r.extras = r.extras.filter((x) => x.id !== id);
    return w;
  });
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
    if (week.prices) delete week.prices[tick];
  }
  const pantry = on && itemId ? { ...d.pantry, [itemId]: "have" as Stock } : d.pantry;
  write({ ...d, pantry, weeks: { ...d.weeks, [weekKey]: week } });
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

/** Copies starter recipes into the library as the user's own, so they can be planned and deleted. */
