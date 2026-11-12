import { addDays, dayName, weekStartFromKey } from "./dates";
import { needs } from "./week";
import { pantryItem } from "@/domain/shop/pantry";
import { slug } from "./week";
import type { Recipe } from "@/domain/recipes/types";
import type { Round, Week } from "./types";

export type Leftovers = { label: string; fresh: Map<string, string>; dishes: Set<string> };

/**
 * The fresh food bought for the cook before this one: the most recent planned cook whose cook day
 * comes before this cook's. Fresh food is whatever the pantry marks fresh, plus anything it doesn't know.
 */
export function lastCookFresh(weeks: Record<string, Week>, weekKey: string, R: Round): Leftovers | null {
  const thisCook = addDays(weekStartFromKey(weekKey), R.cook).getTime();
  let best: { at: number; key: string; round: Round } | null = null;
  for (const [key, w] of Object.entries(weeks)) {
    if (!/^w-\d{4}-\d{2}-\d{2}$/.test(key)) continue;
    for (const r of w.rounds) {
      if (!r.confirmed || (key === weekKey && r.id === R.id)) continue;
      const at = addDays(weekStartFromKey(key), r.cook).getTime();
      if (at < thisCook && (!best || at > best.at)) best = { at, key, round: r };
    }
  }
  if (!best) return null;
  const fresh = new Map<string, string>();
  for (const l of needs(best.round, weeks[best.key].cells)) {
    const item = pantryItem(l.key);
    if (!item || item.fresh) fresh.set(l.key, (item?.name ?? l.name).toLowerCase());
  }
  if (!fresh.size) return null;
  return { label: `${dayName(weekStartFromKey(best.key), best.round.cook, true)}’s cook`, fresh, dishes: new Set(best.round.mains) };
}

/** Dishes that use fresh food left from the last cook, most overlap first, with the shared items named. */
export function dishesUsingLeftovers(recipes: Recipe[], left: Leftovers, limit = 6): { recipe: Recipe; uses: string[] }[] {
  return recipes
    .filter((r) => !left.dishes.has(r.id))
    .map((recipe) => {
      const uses = [...new Set(recipe.ingredients.map((i) => slug(i.name)))].filter((k) => left.fresh.has(k)).map((k) => left.fresh.get(k)!);
      return { recipe, uses };
    })
    .filter((x) => x.uses.length > 0)
    .sort((a, b) => b.uses.length - a.uses.length || a.recipe.title.localeCompare(b.recipe.title))
    .slice(0, limit);
}
