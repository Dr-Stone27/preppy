import { libraryRecipes } from "@/domain/recipes/library";
import { formatQty } from "@/domain/recipes/scale";
import type { Round, Week } from "@/domain/plan/types";
import { needs, slug, type NeedLine } from "@/domain/plan/week";
import { pantryItem, stockOf, type PantryItem, type Stock, type Where } from "./pantry";

export type ShopLine = NeedLine & { item?: PantryItem; where: Where; fresh: boolean; done: boolean };

export const tickKey = (R: Round, key: string) => `${R.id}|${key}`;

/**
 * The round's list. Fresh food is always bought; shelf items you already have go to "Already at home".
 * Unknown ingredients count as fresh and can be bought anywhere.
 */
export function shopLines(R: Round, week: Week, statuses: Record<string, Stock>) {
  const buy: ShopLine[] = [];
  const stocked: ShopLine[] = [];
  for (const l of needs(R, week.cells)) {
    const item = pantryItem(l.key);
    const line: ShopLine = { ...l, item, where: item?.where ?? "any", fresh: item ? item.fresh : true, done: !!week.bought[tickKey(R, l.key)] };
    if (item && !item.fresh && stockOf(statuses, l.key) === "have" && !line.done) stocked.push(line);
    else buy.push(line);
  }
  return { buy, stocked };
}

/** "1.2 kg + 2 tbsp", "some" when the recipe gives no amount. */
export function amountText(l: NeedLine): string {
  const parts = [...l.amounts].map(([unit, q]) => {
    let u = unit;
    let n = q;
    const [head, ...rest] = u.split(" ");
    if ((head === "g" || head === "ml") && n >= 1000) {
      n /= 1000;
      u = [head === "g" ? "kg" : "l", ...rest].join(" ");
    }
    return `${formatQty(n, u)} ${u}`.trim();
  });
  if (l.loose) parts.push(parts.length ? "some" : "as needed");
  return parts.join(" + ");
}

export function roundSpend(R: Round, week: Week) {
  return Object.entries(week.prices)
    .filter(([k]) => k.startsWith(`${R.id}|`))
    .reduce((a, [, v]) => a + (Number(v) || 0), 0);
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

