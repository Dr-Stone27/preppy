import { recipeById } from "@/domain/recipes/library";
import { LOOSE, normUnit } from "@/domain/shop/amounts";
import { pantryMatch } from "@/domain/shop/pantry";
import type { Recipe } from "@/domain/recipes/types";
import { addDays, dateLabel, dayName, daysBetween, weekKey, weekStartFromKey, weekStartOf } from "./dates";
import type { Cell, Prefs, Round, RoundId, SlotId, Week } from "./types";

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

export const FALLBACK_COOK_DAYS = [0, 3];
export const MAX_PEOPLE = 12;

/** How many people each meal feeds, 1 to 12. */
export const peopleOf = (prefs: Prefs) => Math.min(MAX_PEOPLE, Math.max(1, Math.round(Number(prefs.people) || 1)));

/** Set by the store whenever prefs change, so every amount scales without passing it through each screen. */
let household = 1;
export function registerPeople(prefs: Prefs) {
  household = peopleOf(prefs);
}
export const householdSize = () => household;

/** "for 1 person", "for 3 people" */
export const forPeople = (n = household) => `for ${n} ${n === 1 ? "person" : "people"}`;
export const MAX_COOK_DAYS = 3;

/** This person's cook days, sorted, 1 to 3 of them. */
export function cookDaysOf(prefs: Prefs): number[] {
  const days = [...new Set((prefs.cookDays ?? []).filter((d) => Number.isInteger(d) && d >= 0 && d < 7))].sort((a, b) => a - b);
  return days.length ? days.slice(0, MAX_COOK_DAYS) : FALLBACK_COOK_DAYS;
}

/**
 * A fresh week starting on `weekStart`: one round per cook day.
 * Each cook feeds its own day and every day up to the next cook.
 */
export function defaultWeek(prefs: Prefs, weekStart: Date): Week {
  const offsets = cookDaysOf(prefs)
    .map((d) => (d - weekStart.getDay() + 7) % 7)
    .sort((a, b) => a - b);
  // Weeks start on a cook day, so the first offset is 0. If one ever doesn't, the first cook also covers the days before it.
  const rounds: Round[] = offsets.map((cook, k) => {
    const from = k === 0 ? 0 : cook;
    const to = k === offsets.length - 1 ? 6 : offsets[k + 1] - 1;
    return { id: `r${k + 1}` as RoundId, cook, days: Array.from({ length: to - from + 1 }, (_, i) => from + i), mains: [], sweets: [] };
  });
  return { rounds, cells: {}, bought: {} };
}

/** "Sunday’s cook covers Sunday to Tuesday. Wednesday’s covers Wednesday to Saturday." */
export function coverText(days: number[]): string {
  const d = [...days].sort((a, b) => a - b);
  if (!d.length) return "";
  if (d.length === 1) return `${FULL[d[0]]}’s cook covers the whole week.`;
  return d
    .map((c, k) => {
      const last = (d[(k + 1) % d.length] + 6) % 7;
      const span = last === c ? `just ${FULL[c]}` : `${FULL[c]} to ${FULL[last]}`;
      return k === 0 ? `${FULL[c]}’s cook covers ${span}.` : `${FULL[c]}’s covers ${span}.`;
    })
    .join(" ");
}
const FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Starts of the weeks already saved, oldest first. */
function savedStarts(weeks: Record<string, Week>): Date[] {
  return Object.keys(weeks)
    .filter((k) => /^w-\d{4}-\d{2}-\d{2}$/.test(k))
    .map(weekStartFromKey)
    .sort((a, b) => a.getTime() - b.getTime());
}

/**
 * The start of the week that holds this date. A saved week keeps its own start, so changing cook days
 * never moves a week that's already planned; new weeks start on the first cook day.
 */
export function weekStartFor(weeks: Record<string, Week>, prefs: Prefs, d: Date): Date {
  const saved = savedStarts(weeks);
  const holding = saved.filter((s) => s <= d && d < addDays(s, 7)).at(-1);
  if (holding) return holding;
  const first = cookDaysOf(prefs)[0];
  let start = weekStartOf(d, first);
  // Don't overlap a saved week: start on the first cook day after it ends. The days in between belong to no week.
  const clash = saved.filter((s) => s < start && start < addDays(s, 7)).at(-1);
  if (clash) start = weekStartOf(addDays(clash, 13), first);
  return start;
}

/** The week after (`step` 1) or before (-1) the one starting on `start`. */
export function stepWeek(weeks: Record<string, Week>, prefs: Prefs, start: Date, step: 1 | -1): Date {
  if (step === 1) {
    const next = weekStartFor(weeks, prefs, addDays(start, 7));
    return next > start ? next : addDays(start, 7);
  }
  const prev = weekStartFor(weeks, prefs, addDays(start, -1));
  if (prev < start) return prev;
  // The day before is in a gap left by changing cook days; go to the saved week before the gap.
  const before = savedStarts(weeks).filter((s) => s < start).at(-1);
  return before && addDays(before, 7) > addDays(start, -7) ? before : addDays(start, -7);
}

export const weekKeyFor = (weeks: Record<string, Week>, prefs: Prefs, d: Date) => weekKey(weekStartFor(weeks, prefs, d));

export const cellKey = (day: number, slot: SlotId) => `${day}|${slot}`;
export const roundOfDay = (w: Week, day: number) => w.rounds.find((r) => r.days.includes(day))!;

export const recipesFor = (ids: string[]) => ids.map(recipeById).filter((r): r is Recipe => r !== undefined);

export function roundDates(weekStart: Date, R: Round) {
  return { cook: addDays(weekStart, R.cook), first: addDays(weekStart, R.days[0]), last: addDays(weekStart, R.days.at(-1)!) };
}

/** "Sun 8 – Wed 11 Nov" */
export function roundRange(weekStart: Date, R: Round) {
  const d = roundDates(weekStart, R);
  return R.days.length === 1
    ? `${dayName(weekStart, R.days[0])} ${dateLabel(d.first)}`
    : `${dayName(weekStart, R.days[0])} ${d.first.getDate()} – ${dayName(weekStart, R.days.at(-1)!)} ${dateLabel(d.last)}`;
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
      // With a single sweet dish, serving it at breakfast and again as dessert every day looks careless.
      if (slot.kind === "sweet" && list.length === 1 && slot.id === "dessert") continue;
      const id = list[(slot.kind === "main" ? i++ : j++) % list.length];
      const cell: Cell = { r: id };
      if (slot.kind === "main" && bases.length && !recipeById(id)!.withCarb) cell.base = bases[b++ % bases.length];
      cells[cellKey(d, slot.id)] = cell;
    }
  return cells;
}

/** The mains actually on this cook's meals, including any swapped in one meal at a time. Falls back to the picks before meals are filled. */
export function roundMains(R: Round, cells: Record<string, Cell>): string[] {
  const ids: string[] = [];
  for (const d of R.days)
    for (const slot of SLOTS) {
      const id = slot.kind === "main" ? cells[cellKey(d, slot.id)]?.r : undefined;
      if (id && recipeById(id) && !ids.includes(id)) ids.push(id);
    }
  return ids.length ? ids : R.mains;
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

/** Everything the round needs, scaled to the number of meals each dish covers and the people each meal feeds. */
export function needs(R: Round, cells: Record<string, Cell>): NeedLine[] {
  const { rec, bases } = usesOf(R, cells);
  const lines = new Map<string, NeedLine>();
  const add = (name: string, qty: number | null, unit: string, from: string) => {
    // "onion" in a typed recipe joins "Onions" from the library.
    const key = pantryMatch(name)?.id ?? slug(name);
    if (key === "water") return;
    let l = lines.get(key);
    if (!l) lines.set(key, (l = { key, name, amounts: new Map(), loose: false, from: new Set() }));
    const u = normUnit(unit);
    if (qty == null || Number.isNaN(qty) || u === LOOSE) l.loose = true;
    else l.amounts.set(u, (l.amounts.get(u) ?? 0) + qty);
    l.from.add(from);
  };
  for (const [id, n] of rec) {
    const r = recipeById(id)!;
    const f = (n * household) / (r.servings || 1);
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
  const all = R.days.map((d) => dayMacros(d, cells));
  const known = all.reduce((a, m) => a + m.known, 0);
  const unknown = all.reduce((a, m) => a + m.unknown, 0);
  // Too few meals with numbers makes a daily total look wrong, so give none.
  if (!known || known / (known + unknown) < 0.75) return null;
  const ds = all.filter((m) => m.known);
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

/**
 * A round you can still do something with: its cook day hasn't passed, or it's planned and still feeding today or later.
 * An unplanned round whose cook day has gone can't be cooked any more.
 */
export function roundIsOpen(R: Round, weekStart: Date, today: Date) {
  const { cook, last } = roundDates(weekStart, R);
  return cook >= today || (!!R.confirmed && last >= today);
}

/**
 * The week Plan and Shop open on: this week while it still has an open round, otherwise next week.
 * Someone starting on a Thursday with Sunday and Wednesday cook days lands on next week, not on two cooks that are over.
 */
export function openWeekStart(weeks: Record<string, Week>, prefs: Prefs, today: Date, getWeek: (key: string) => Week): { start: Date; moved: boolean } {
  const start = weekStartFor(weeks, prefs, today);
  if (getWeek(weekKey(start)).rounds.some((R) => roundIsOpen(R, start, today))) return { start, moved: false };
  return { start: stepWeek(weeks, prefs, start, 1), moved: true };
}

/** The next cook that can still be planned or shopped for: in the week Plan opens on, the first whose cook day hasn't passed. */
export function nextOpenCook(weeks: Record<string, Week>, prefs: Prefs, today: Date, getWeek: (key: string) => Week) {
  const { start } = openWeekStart(weeks, prefs, today, getWeek);
  const key = weekKey(start);
  const week = getWeek(key);
  const round = week.rounds.find((R) => !R.cooked && roundDates(start, R).cook >= today) ?? week.rounds[0];
  return { weekKey: key, weekStart: start, round };
}

/** The next round that hasn't been cooked and whose cook day is today or later. */
export function nextRound(w: Week, weekStart: Date, today: Date) {
  return w.rounds.find((R) => !R.cooked && roundDates(weekStart, R).cook >= today) ?? null;
}

/**
 * The cook that holds today when its day has passed and it was never planned: someone starting partway
 * through a week can cook today for the days that are left instead. Null when there's nothing to offer.
 */
export function missedCook(w: Week, weekStart: Date, today: Date): Round | null {
  const day = daysBetween(weekStart, today);
  const R = day >= 0 && day <= 6 ? w.rounds.find((r) => r.days.includes(day)) : undefined;
  return R && !R.confirmed && !R.cooked && R.cook < day ? R : null;
}

/** "Sunday cook" */
export const roundLabel = (R: Round, weekStart: Date) => `${dayName(weekStart, R.cook, true)} cook`;
