import type { Ingredient } from "./types";

const FRACTIONS: [number, string][] = [
  [0.25, "¼"],
  [0.33, "⅓"],
  [0.5, "½"],
  [0.67, "⅔"],
  [0.75, "¾"],
];

const METRIC = /^(g|kg|ml|l|litres?|liters?)$/i;

/** Kitchen-friendly number: fractions for spoons and cups, rounded grams, whole counts. */
export function formatQty(q: number, unit: string): string {
  if (METRIC.test(unit.trim().split(" ")[0])) {
    if (q >= 100) return String(Math.round(q / 10) * 10);
    if (q >= 10) return String(Math.round(q / 5) * 5);
    return String(Math.round(q * 10) / 10);
  }
  const whole = Math.floor(q);
  const frac = q - whole;
  if (frac < 0.12) return String(whole || q.toFixed(1));
  if (frac > 0.88) return String(whole + 1);
  const [, glyph] = FRACTIONS.reduce((best, f) => (Math.abs(f[0] - frac) < Math.abs(best[0] - frac) ? f : best));
  return whole ? `${whole}${glyph}` : glyph;
}

export type ScaledIngredient = { name: string; amount: string };

/** Rescale a recipe's ingredients from its own servings to the servings chosen. Unknown amounts stay blank. */
export function scaleIngredients(ingredients: Ingredient[], from: number, to: number): ScaledIngredient[] {
  const f = to / (from || 1);
  return ingredients.map((i) => {
    if (i.qty == null || Number.isNaN(Number(i.qty))) return { name: i.name, amount: (i.unit ?? "").trim() };
    let unit = (i.unit ?? "").trim();
    let q = Number(i.qty) * f;
    // 1200 g reads better as 1.2 kg once scaled up.
    const [head, ...rest] = unit.split(" ");
    if ((head === "g" || head === "ml") && q >= 1000) {
      q = q / 1000;
      unit = [head === "g" ? "kg" : "l", ...rest].join(" ");
    }
    return { name: i.name, amount: `${formatQty(q, unit)} ${unit}`.trim() };
  });
}
