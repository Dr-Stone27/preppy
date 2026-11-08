import { cuisineOf } from "@/domain/bowl/fromRecipe";
import type { CuisineFamily } from "@/domain/bowl/types";
import type { Recipe, RecipeKind } from "./types";

export const CUISINE_LABEL: Record<CuisineFamily, string> = {
  nigerian: "Nigerian",
  korean: "Korean",
  chinese: "Chinese",
  japanese: "Japanese",
  indian: "Indian",
  tex_mex: "Tex-Mex",
  bbq: "BBQ",
  middle_eastern: "Middle Eastern",
  caribbean: "Caribbean",
  dessert: "Sweet",
  other: "Other",
};

export type LibraryFilter = { query: string; kind: RecipeKind | "all" | "you"; cuisine: CuisineFamily | "all" };

/** Cuisines present in the library, most common first, for the filter chips. */
export function cuisinesIn(recipes: Recipe[]): CuisineFamily[] {
  const counts = new Map<CuisineFamily, number>();
  for (const r of recipes) {
    if (r.kind === "sweet") continue;
    const c = cuisineOf(r);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([c]) => c !== "other").sort((a, b) => b[1] - a[1]).map(([c]) => c);
}

export function filterRecipes(recipes: Recipe[], f: LibraryFilter): Recipe[] {
  const q = f.query.trim().toLowerCase();
  return recipes.filter((r) => {
    if (f.kind === "you" ? r.origin !== "you" : f.kind !== "all" && r.kind !== f.kind) return false;
    if (f.cuisine !== "all" && cuisineOf(r) !== f.cuisine) return false;
    if (!q) return true;
    const hay = [r.title, r.protein, r.flavour, ...r.ingredients.map((i) => i.name)].join(" ").toLowerCase();
    return q.split(/\s+/).every((word) => hay.includes(word));
  });
}
