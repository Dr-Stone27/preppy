import { libraryRecipes } from "@/domain/recipes/library";
import type { Round, Week } from "@/domain/plan/types";
import { needs, slug, type NeedLine } from "@/domain/plan/week";
import { shopAmount } from "./amounts";
import { groupOf, pantryItem, stockOf, type PantryItem, type Stock } from "./pantry";

export type ShopLine = NeedLine & { item?: PantryItem; group: string; fresh: boolean; done: boolean };

export const tickKey = (R: Round, key: string) => `${R.id}|${key}`;

/**
 * The round's list. Fresh food is always bought; shelf items you already have go to "Already at home".
 * Unknown ingredients count as fresh and are listed under Other.
 */
export function shopLines(R: Round, week: Week, statuses: Record<string, Stock>) {
  const buy: ShopLine[] = [];
  const stocked: ShopLine[] = [];
  for (const l of needs(R, week.cells)) {
    const item = pantryItem(l.key);
    const line: ShopLine = { ...l, item, group: groupOf(item?.group), fresh: item ? item.fresh : true, done: !!week.bought[tickKey(R, l.key)] };
    if (item && !item.fresh && stockOf(statuses, l.key) === "have" && !line.done) stocked.push(line);
    else buy.push(line);
  }
  return { buy, stocked };
}

/** What to buy, in plain amounts ("2 onions", "1 bulb"), plus what the recipes use when that differs. */
export function amountText(l: ShopLine): string {
  return shopAmount(l.key, l.amounts, l.loose, l.fresh).text;
}

export function amountNeed(l: ShopLine): string | undefined {
  return shopAmount(l.key, l.amounts, l.loose, l.fresh).need;
}

/** Every ingredient any saved recipe or side uses, with the recipes that use it. */
export function allNeeded(bases: string[]) {
  const m = new Map<string, { key: string; name: string; from: Set<string> }>();
  const add = (name: string, from: string) => {
    const key = slug(name);
    if (key === "water") return;
    if (!m.has(key)) m.set(key, { key, name, from: new Set() });
    m.get(key)!.from.add(from);
  };
  for (const r of libraryRecipes()) for (const i of r.ingredients) add(i.name, r.title);
  for (const b of bases) add(b, "Sides");
  return [...m.values()].map((x) => ({ ...x, item: pantryItem(x.key) }));
}

