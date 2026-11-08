import data from "@/data/starter-library.json";
import type { Recipe } from "./types";

/**
 * Recipe source: the Prep Week export (11 Oct 2026) plus recipes saved on this device.
 * Saved recipes are registered by the client store; on the server only the export is visible.
 * Screens should only call these functions, so the source can move to the database later.
 */
const ALL = (data.recipes as unknown as Recipe[]).map((r) => ({ ...r, servings: Number(r.servings) || 1 }));
let mine: Recipe[] = [];
let mineById = new Map<string, Recipe>();

export function registerSavedRecipes(list: Recipe[]) {
  mine = list;
  mineById = new Map(list.map((r) => [r.id, r]));
}

/** The owner's recipes, carried over from Prep Week, plus any saved here. */
export function myRecipes(): Recipe[] {
  return [...ALL.filter((r) => r.origin === "owner-library"), ...mine].sort((a, b) => a.title.localeCompare(b.title));
}

/** Recipes written for Preppy's starter library (shown to new users in a later slice). */
export function starterRecipes(): Recipe[] {
  return ALL.filter((r) => r.origin === "preppy-starter");
}

export function allRecipes(): Recipe[] {
  return [...ALL, ...mine];
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
