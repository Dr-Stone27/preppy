import { recipeById } from "@/domain/recipes/library";
import type { Recipe } from "@/domain/recipes/types";
import { dayName } from "./dates";
import type { Cell, CookPlan, Round } from "./types";
import { cellKey, SLOTS, usesOf } from "./week";

/** Mains cooked today and how many portions each. Sweets are made fresh, so they're left out. */
export function cookDishes(R: Round, cells: Record<string, Cell>): { recipe: Recipe; portions: number }[] {
  return [...usesOf(R, cells).rec]
    .map(([id, n]) => ({ recipe: recipeById(id)!, portions: n }))
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

export function fallbackPlan(R: Round, cells: Record<string, Cell>): CookPlan {
  const steps = cookDishes(R, cells).flatMap(({ recipe: r }) =>
    r.steps.map((detail, i) => ({
      title: stepTitle(detail, i === 0 ? `Start the ${r.title}` : `Step ${i + 1}`),
      detail,
      appliance: "",
      recipe: r.title,
      minutes: null,
      meanwhile: null,
    })),
  );
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
    for (const d of R.days)
      for (const s of SLOTS) {
        if (cells[cellKey(d, s.id)]?.r !== recipe.id) continue;
        (goesInFreezer(R, d) ? freezer : fridge).push(`${dayName(weekStart, d)} ${s.label.toLowerCase()}`);
      }
    return { recipe, fridge, freezer };
  });
}
