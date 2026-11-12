import { slug } from "@/domain/plan/week";
import { pantryItem, stockOf, type Stock } from "@/domain/shop/pantry";
import { swapFor } from "./bases";
import type { Recipe } from "./types";

export type Match = {
  recipe: Recipe;
  /** Fresh things the dish uses that you said you have. */
  have: string[];
  /** Fresh things it needs that you don't have. */
  needFresh: { key: string; name: string }[];
  /** Cupboard things it needs that aren't marked Have or Low at home. */
  needShelf: { key: string; name: string }[];
  /** Missing things covered by something you have instead. */
  swaps: { for: string; use: string; close: boolean }[];
};

/**
 * What you can make from what you have. Fresh food counts only if you ticked it here (it goes off, so the app
 * doesn't track it); dry goods, spices and sauces count if they're marked Have or Low at home.
 * A missing thing counts as covered when you have a swap for it (red bell pepper for tatashe).
 * A dish shows only if it uses at least one fresh thing you have, directly or as a swap. Fewest missing fresh things first, then the ones
 * that use more of what you have, then the fewest cupboard things to buy.
 */
export function cookFromWhatYouHave(recipes: Recipe[], fresh: Set<string>, statuses: Record<string, Stock>, typed: Record<string, string> = {}): Match[] {
  const has = (key: string) => {
    const item = pantryItem(key);
    return !item || item.fresh ? fresh.has(key) : stockOf(statuses, key) !== "out";
  };
  const nameOf = (key: string) => (pantryItem(key)?.name ?? typed[key] ?? key.replace(/-/g, " ")).toLowerCase();
  const out: Match[] = [];
  for (const recipe of recipes) {
    const seen = new Set<string>();
    const m: Match = { recipe, have: [], needFresh: [], needShelf: [], swaps: [] };
    let freshSwaps = 0;
    for (const ing of recipe.ingredients) {
      const key = slug(ing.name);
      if (key === "water" || seen.has(key)) continue;
      seen.add(key);
      const item = pantryItem(key);
      const name = (item?.name ?? ing.name).toLowerCase();
      const isFresh = !item || item.fresh;
      if (isFresh ? fresh.has(key) : stockOf(statuses, key) !== "out") {
        if (isFresh) m.have.push(name);
        continue;
      }
      const swap = swapFor(key, has);
      if (swap) {
        m.swaps.push({ for: name, use: nameOf(swap.use), close: swap.close });
        if (isFresh) freshSwaps++;
      } else (isFresh ? m.needFresh : m.needShelf).push({ key, name });
    }
    if (m.have.length || freshSwaps) out.push(m);
  }
  return out.sort(
    (a, b) =>
      a.needFresh.length - b.needFresh.length ||
      b.have.length - a.have.length ||
      a.swaps.length - b.swaps.length ||
      a.needShelf.length - b.needShelf.length ||
      a.recipe.title.localeCompare(b.recipe.title),
  );
}
