import data from "@/data/starter-library.json";
import type { Recipe } from "./types";

/**
 * The shared library (the Prep Week export of 11 Oct 2026 plus the recipes written for Preppy),
 * which every user sees, plus the user's own saved recipes, registered by the client store.
 * Screens should only call these functions, so the source can move to the database later.
 */
const ALL = (data.recipes as unknown as Recipe[]).map((r) => ({ ...r, servings: Number(r.servings) || 1 }));
let mine: Recipe[] = [];
let mineById = new Map<string, Recipe>();

export function registerSavedRecipes(list: Recipe[]) {
  mine = list;
  mineById = new Map(list.map((r) => [r.id, r]));
}

/** Everything the user can plan with: the shared library plus their own, A to Z. */
export function libraryRecipes(): Recipe[] {
  return allRecipes().sort((a, b) => a.title.localeCompare(b.title));
}

export function allRecipes(): Recipe[] {
  const own = new Set(mine.map((r) => r.id));
  // A starter copied in by an earlier version of setup shows once, as the user's.
  return [...ALL.filter((r) => !own.has(r.id)), ...mine];
}

export function recipeById(id: string): Recipe | undefined {
  return mineById.get(id) ?? ALL.find((r) => r.id === id);
}

/** Saved recipes open on a client page; exported ones are prerendered. */
export const recipeHref = (r: Recipe) => (r.origin === "you" ? `/library/saved?id=${encodeURIComponent(r.id)}` : `/library/${r.id}`);

/** An earlier save of the same post, matched on the link without its query string. */
export function findBySource(link: string): Recipe | undefined {
  const k = link.split("?")[0].replace(/\/$/, "");
  if (!k) return undefined;
  return allRecipes().find((r) => (r.source ?? "").split("?")[0].replace(/\/$/, "") === k);
}
