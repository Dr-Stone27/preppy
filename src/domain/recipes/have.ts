import { slug } from "@/domain/plan/week";
import { pantryItem, stockOf, type Stock } from "@/domain/shop/pantry";
import type { Recipe } from "./types";

export type Match = {
  recipe: Recipe;
  /** Fresh things the dish uses that you said you have. */
  have: string[];
  /** Fresh things it needs that you don't have. */
  needFresh: { key: string; name: string }[];
  /** Cupboard things it needs that aren't marked Have or Low at home. */
  needShelf: { key: string; name: string }[];
};

/**
 * What you can make from what you have. Fresh food counts only if you ticked it here (it goes off, so the app
 * doesn't track it); dry goods, spices and sauces count if they're marked Have or Low at home.
 * A dish shows only if it uses at least one fresh thing you have. Fewest missing fresh things first, then the ones
 * that use more of what you have, then the fewest cupboard things to buy.
 */
export function cookFromWhatYouHave(recipes: Recipe[], fresh: Set<string>, statuses: Record<string, Stock>): Match[] {
  const out: Match[] = [];
  for (const recipe of recipes) {
    const seen = new Set<string>();
    const m: Match = { recipe, have: [], needFresh: [], needShelf: [] };
    for (const ing of recipe.ingredients) {
      const key = slug(ing.name);
      if (key === "water" || seen.has(key)) continue;
      seen.add(key);
      const item = pantryItem(key);
      const name = (item?.name ?? ing.name).toLowerCase();
      if (!item || item.fresh) {
        if (fresh.has(key)) m.have.push(name);
        else m.needFresh.push({ key, name });
      } else if (stockOf(statuses, key) === "out") m.needShelf.push({ key, name });
    }
    if (m.have.length) out.push(m);
  }
  return out.sort(
    (a, b) =>
      a.needFresh.length - b.needFresh.length ||
      b.have.length - a.have.length ||
      a.needShelf.length - b.needShelf.length ||
      a.recipe.title.localeCompare(b.recipe.title),
  );
}
