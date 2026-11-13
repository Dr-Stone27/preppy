import { baseById, baseOf, type Base } from "@/domain/recipes/bases";
import { recipeById } from "@/domain/recipes/library";
import { scaleIngredients } from "@/domain/recipes/scale";
import type { Recipe } from "@/domain/recipes/types";
import { dayName } from "./dates";
import type { Cell, CookPlan, Round } from "./types";
import { cellKey, householdSize, SLOTS, usesOf } from "./week";

/** Mains cooked today and how many portions each (meals × people). Sweets are made fresh, so they're left out. */
export function cookDishes(R: Round, cells: Record<string, Cell>): { recipe: Recipe; portions: number }[] {
  return [...usesOf(R, cells).rec]
    .map(([id, n]) => ({ recipe: recipeById(id)!, portions: n * householdSize() }))
    .filter((d) => d.recipe && d.recipe.kind !== "sweet");
}

/** Without the AI ordering: each recipe's own steps, one dish after another. */
/** A short heading for a recipe step: its first clause ("Heat the oil in a large pot"), or the fallback when there isn't one. */
export function stepTitle(step: string, fallback: string) {
  const first = step.trim().split(/(?<=[.!?;:])\s|,\s(?:then|and then|until)\s/i)[0].replace(/[.!?;:,]+$/, "").trim();
  if (!first) return fallback;
  if (first.length <= 60) return first;
  const cut = first.slice(0, 57);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 30 ? cut.lastIndexOf(" ") : 57)}…`;
}

/** The rest of a step after its title, so the heading and the text underneath don't say the same thing. */
function afterTitle(step: string, title: string) {
  if (title.endsWith("…")) return step;
  const rest = step.trim().slice(title.length).replace(/^[\s.!?;:,]+/, "").replace(/^(then|and then)\s+/i, "").trim();
  return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : "";
}

export function fallbackPlan(R: Round, cells: Record<string, Cell>): CookPlan {
  const steps = cookDishes(R, cells).flatMap(({ recipe: r, portions }) => [
    {
      title: `Get out what ${r.title} needs`,
      detail: scaleIngredients(r.ingredients, r.servings, portions)
        .map((x) => (x.amount ? `${x.amount} ${x.name}` : x.name))
        .join(" · "),
      appliance: "Prep",
      recipe: r.title,
      minutes: null,
      meanwhile: null,
    },
    ...r.steps.map((step, i) => {
      const title = stepTitle(step, i === 0 ? `Start the ${r.title}` : `Step ${i + 1}`);
      // A long first clause would be cut off and then repeated in full, so such a step has no heading.
      const cut = title.endsWith("…");
      return { title: cut ? "" : title, detail: afterTitle(step, title), appliance: "", recipe: r.title, minutes: null, meanwhile: null };
    }),
  ]);
  return { minutes: null, steps, storeTips: [], ordered: false };
}

/** Shape-check the AI's plan. Throws if there's nothing usable. */
export function planFromAi(d: unknown): CookPlan {
  const x = d as { minutes?: unknown; steps?: unknown; storeTips?: unknown };
  if (!x || !Array.isArray(x.steps) || !x.steps.length) throw new Error("shape");
  return {
    minutes: Number(x.minutes) || null,
    steps: (x.steps as Record<string, unknown>[]).map((s) => ({
      title: String(s.title ?? ""),
      detail: String(s.detail ?? ""),
      appliance: String(s.appliance ?? ""),
      recipe: String(s.recipe ?? ""),
      minutes: Number(s.minutes) || null,
      meanwhile: s.meanwhile ? String(s.meanwhile) : null,
    })),
    storeTips: Array.isArray(x.storeTips) ? x.storeTips.map(String) : [],
    ordered: true,
  };
}

/** Meals within two days of cooking keep in the fridge; later ones go in the freezer. */
export const goesInFreezer = (R: Round, day: number) => day - R.cook > 2;

/** Meals within two days of cooking go in the fridge; later ones go in the freezer. */
export function storePlan(R: Round, cells: Record<string, Cell>, weekStart: Date) {
  return cookDishes(R, cells).map(({ recipe }) => {
    const fridge: string[] = [];
    const freezer: string[] = [];
    const sides = new Set<string>();
    for (const d of R.days)
      for (const s of SLOTS) {
        const c = cells[cellKey(d, s.id)];
        if (c?.r !== recipe.id) continue;
        if (c.base) sides.add(c.base.toLowerCase());
        (goesInFreezer(R, d) ? freezer : fridge).push(`${dayName(weekStart, d)} ${s.label.toLowerCase()}`);
      }
    return { recipe, fridge, freezer, sides: [...sides] };
  });
}

/** Bases two or more of today's dishes share, so the cook can make each once. */
export function sharedBases(recipes: Recipe[]): { base: Base; dishes: string[] }[] {
  const by = new Map<string, string[]>();
  for (const r of recipes) {
    const b = baseOf(r);
    if (b) by.set(b, [...(by.get(b) ?? []), r.title]);
  }
  return [...by].filter(([, d]) => d.length > 1).map(([b, dishes]) => ({ base: baseById(b as Base["id"]), dishes }));
}

/** What to store apart so it stays crisp or fresh, or null. */
export function keepApart(r: Recipe): string | null {
  const names = r.ingredients.map((i) => i.name.toLowerCase());
  const crisp = /crispy|fried chicken|suya|akara/i.test(r.title);
  const fresh = names.some((n) => /cucumber|watercress|lettuce/.test(n));
  if (crisp && fresh) return "Keep the salad in its own container, and reheat the rest in the oven or air fryer, not the microwave, so it stays crisp.";
  if (crisp) return "Store it apart from any sauce or rice, and reheat it in the oven or air fryer, not the microwave, so it stays crisp.";
  if (fresh) return "Keep the cucumber and other raw bits in their own container. They go watery if packed with hot food.";
  return null;
}

/** Dishes whose method needs starting the day before (an overnight marinade or soak). */
export function startTheDayBefore(recipes: Recipe[]): string[] {
  return recipes.filter((r) => r.steps.some((s) => /overnight|the night before|the day before/i.test(s))).map((r) => r.title);
}
