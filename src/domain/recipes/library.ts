import data from "@/data/starter-library.json";
import type { Recipe } from "./types";

/**
 * Read-only recipe source for slice 1, loaded from the Prep Week export (11 Oct 2026).
 * Replaced by the per-user database in a later slice; screens should only call these functions.
 */
const ALL = (data.recipes as unknown as Recipe[]).map((r) => ({ ...r, servings: Number(r.servings) || 1 }));

/** The owner's own recipes, carried over from Prep Week. */
export function myRecipes(): Recipe[] {
  return ALL.filter((r) => r.origin === "owner-library").sort((a, b) => a.title.localeCompare(b.title));
}

/** Recipes written for Preppy's starter library (shown to new users in a later slice). */
export function starterRecipes(): Recipe[] {
  return ALL.filter((r) => r.origin === "preppy-starter");
}

export function allRecipes(): Recipe[] {
  return ALL;
}

export function recipeById(id: string): Recipe | undefined {
  return ALL.find((r) => r.id === id);
}
