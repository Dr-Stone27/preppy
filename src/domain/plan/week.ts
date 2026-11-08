import { recipeById } from "@/domain/recipes/library";
import type { Recipe } from "@/domain/recipes/types";
import { addDays, dateLabel, DAYS } from "./dates";
import type { Cell, Prefs, Round, SlotId, Week } from "./types";

export const SLOTS: { id: SlotId; label: string; short: string; kind: "main" | "sweet" }[] = [
  { id: "breakfast", label: "Breakfast", short: "Bfast", kind: "sweet" },
  { id: "lunch", label: "Lunch", short: "Lunch", kind: "main" },
  { id: "dinner", label: "Dinner", short: "Dinner", kind: "main" },
  { id: "dessert", label: "Dessert", short: "Sweet", kind: "sweet" },
];

export const DEFAULT_PREFS: Prefs = {
  // A new person starts with nothing chosen; setup asks.
  never: [],
  bases: [],
};

/** Sunday cooks for Sunday to Wednesday; Wednesday cooks for Thursday to Saturday. */
export function defaultWeek(): Week {
  return {
    rounds: [
      { id: "r1", cook: 0, days: [0, 1, 2, 3], mains: [], sweets: [] },
      { id: "r2", cook: 3, days: [4, 5, 6], mains: [], sweets: [] },
    ],
    cells: {},
    bought: {},
    prices: {},
  };
}

export const cellKey = (day: number, slot: SlotId) => `${day}|${slot}`;
export const roundOfDay = (w: Week, day: number) => w.rounds.find((r) => r.days.includes(day))!;

export const recipesFor = (ids: string[]) => ids.map(recipeById).filter((r): r is Recipe => r !== undefined);

export function roundDates(weekStart: Date, R: Round) {
  return { cook: addDays(weekStart, R.cook), first: addDays(weekStart, R.days[0]), last: addDays(weekStart, R.days.at(-1)!) };
}

/** "Sun 8 – Wed 11 Nov" */
export function roundRange(weekStart: Date, R: Round) {
  const d = roundDates(weekStart, R);
  return `${DAYS[R.days[0]]} ${d.first.getDate()} – ${DAYS[R.days.at(-1)!]} ${dateLabel(d.last)}`;
}

export const roundStatus = (R: Round) => (R.cooked ? "Cooked" : R.confirmed ? "Planned" : "Not planned");

/**
 * Spread the round's dishes across its days: mains rotate through lunch and dinner,
 * sweets through breakfast and dessert. Mains without their own carb get a side, rotating through the user's sides.
 */
export function fillCells(R: Round, mains: string[], sweets: string[], bases: string[]): Record<string, Cell> {
  const cells: Record<string, Cell> = {};
  const m = mains.filter((id) => recipeById(id));
  const s = sweets.filter((id) => recipeById(id));
  let i = 0, j = 0, b = 0;
  for (const d of R.days)
    for (const slot of SLOTS) {
      const list = slot.kind === "main" ? m : s;
      if (!list.length) continue;
      const id = list[(slot.kind === "main" ? i++ : j++) % list.length];
      const cell: Cell = { r: id };
      if (slot.kind === "main" && bases.length && !recipeById(id)!.withCarb) cell.base = bases[b++ % bases.length];
      cells[cellKey(d, slot.id)] = cell;
    }
  return cells;
}

/** How many meals each dish covers in this round. */
export function usesOf(R: Round, cells: Record<string, Cell>) {
  const rec = new Map<string, number>();
  const bases = new Map<string, number>();
  for (const d of R.days)
    for (const slot of SLOTS) {
      const c = cells[cellKey(d, slot.id)];
      if (!c) continue;
      if (recipeById(c.r)) rec.set(c.r, (rec.get(c.r) ?? 0) + 1);
      if (c.base) bases.set(c.base, (bases.get(c.base) ?? 0) + 1);
    }
  return { rec, bases };
}

export type NeedLine = { key: string; name: string; amounts: Map<string, number>; loose: boolean; from: Set<string> };

export const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "item";

/** Everything the round needs, scaled to the number of meals each dish covers. */
export function needs(R: Round, cells: Record<string, Cell>): NeedLine[] {
  const { rec, bases } = usesOf(R, cells);
  const lines = new Map<string, NeedLine>();
  const add = (name: string, qty: number | null, unit: string, from: string) => {
    const key = slug(name);
    if (key === "water") return;
    let l = lines.get(key);
    if (!l) lines.set(key, (l = { key, name, amounts: new Map(), loose: false, from: new Set() }));
    if (qty == null || Number.isNaN(qty)) l.loose = true;
    else {
      const u = (unit ?? "").trim().toLowerCase();
      l.amounts.set(u, (l.amounts.get(u) ?? 0) + qty);
    }
    l.from.add(from);
  };
  for (const [id, n] of rec) {
    const r = recipeById(id)!;
    const f = n / (r.servings || 1);
    for (const i of r.ingredients) add(i.name, i.qty == null ? null : Number(i.qty) * f, i.unit, r.title);
  }
  for (const [b] of bases) add(b, null, "", "Sides");
  return [...lines.values()];
}

const EGG_UNITS = /^(|pc|pcs|piece|pieces|egg|eggs|large|medium|whole)$/;

export function eggCount(R: Round, cells: Record<string, Cell>) {
  const l = needs(R, cells).find((x) => x.key === "eggs");
  if (!l) return 0;
  let n = 0;
  for (const [u, q] of l.amounts) if (EGG_UNITS.test(u)) n += q;
  return Math.ceil(n);
}

export function dayMacros(day: number, cells: Record<string, Cell>) {
  let kcal = 0, protein = 0, known = 0, unknown = 0;
  for (const slot of SLOTS) {
    const c = cells[cellKey(day, slot.id)];
    const r = c && recipeById(c.r);
    if (!r) continue;
    if (r.macros && (r.macros.kcal || r.macros.protein)) {
      kcal += r.macros.kcal ?? 0;
      protein += r.macros.protein ?? 0;
      known++;
    } else unknown++;
  }
  return { kcal, protein, known, unknown };
}

/** Average known kcal and protein a day. `partial` means some meals have no numbers. */
export function roundAverage(R: Round, cells: Record<string, Cell>) {
  const ds = R.days.map((d) => dayMacros(d, cells)).filter((m) => m.known);
  if (!ds.length) return null;
  return {
    kcal: Math.round(ds.reduce((a, m) => a + m.kcal, 0) / ds.length),
    protein: Math.round(ds.reduce((a, m) => a + m.protein, 0) / ds.length),
    partial: ds.some((m) => m.unknown),
  };
}

/** Flavours shared by more than one main. Empty means the round has variety. */
export function repeatedFlavours(mains: string[]) {
  const seen = new Map<string, { label: string; n: number }>();
  for (const r of recipesFor(mains)) {
    const label = r.flavour || "Unlabelled";
    const k = label.toLowerCase();
    seen.set(k, { label, n: (seen.get(k)?.n ?? 0) + 1 });
  }
  return { flavours: seen.size, repeats: [...seen.values()].filter((v) => v.n > 1).map((v) => v.label) };
}

/** The next round that hasn't been cooked and whose cook day is today or later. */
export function nextRound(w: Week, weekStart: Date, today: Date) {
  return w.rounds.find((R) => !R.cooked && roundDates(weekStart, R).cook >= today) ?? null;
}

const COOK_DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** "Sunday cook" */
export const roundLabel = (R: Round) => `${COOK_DAY[R.cook]} cook`;
