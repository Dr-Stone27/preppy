import { slug } from "@/domain/plan/week";
import type { Ingredient, Macros, Recipe } from "./types";

/** The iOS Shortcut shares "link\ncaption". Returns null for anything else. */
export function parseShared(raw: string): { link: string; caption: string } | null {
  const lines = raw.replace(/\r/g, "").split("\n");
  const first = (lines[0] ?? "").trim();
  if (!/^https?:\/\/(www\.)?instagram\.com\//i.test(first)) return null;
  const caption = lines
    .slice(1)
    .join("\n")
    .trim()
    .replace(/^[\d.,]+[KkMm]? likes?, [\d.,]+[KkMm]? comments? - [^:]{1,80}: "/, "")
    .replace(/"\.?\s*$/, "")
    .trim();
  return { link: first.split("?")[0], caption };
}

function cleanMacros(m: unknown): Macros | undefined {
  if (!m || typeof m !== "object") return undefined;
  const o: Macros = {};
  for (const k of ["kcal", "protein", "carbs", "fat"] as const) {
    const v = Number((m as Record<string, unknown>)[k]);
    if ((m as Record<string, unknown>)[k] != null && (m as Record<string, unknown>)[k] !== "" && !Number.isNaN(v)) o[k] = Math.round(v);
  }
  return o.kcal || o.protein ? o : undefined;
}

export const newId = (title: string) => `${slug(title)}-${Math.random().toString(36).slice(2, 6)}`;

/** Shape-check the model's reply. Anything missing becomes a blank the cook can fill in. */
export function recipeFromAi(d: unknown, link: string): Recipe {
  if (!d || typeof d !== "object" || !Array.isArray((d as { ingredients?: unknown }).ingredients)) throw new Error("shape");
  const x = d as Record<string, unknown>;
  const title = String(x.title || "Untitled recipe");
  const macros = cleanMacros(x.macros);
  return {
    id: newId(title),
    title,
    kind: x.kind === "sweet" ? "sweet" : "main",
    servings: Number(x.servings) || 1,
    protein: String(x.protein || "") || undefined,
    flavour: String(x.flavour || "") || undefined,
    withCarb: !!x.withCarb,
    ingredients: (x.ingredients as Record<string, unknown>[])
      .map((i) => ({
        name: String(i.name || "").trim(),
        qty: i.qty == null || Number.isNaN(Number(i.qty)) ? null : Number(i.qty),
        unit: String(i.unit || ""),
      }))
      .filter((i) => i.name && slug(i.name) !== "water"),
    steps: Array.isArray(x.steps) ? x.steps.map(String) : [],
    flags: Array.isArray(x.flags) ? x.flags.map(String) : [],
    source: link || undefined,
    macros,
    macrosSource: macros ? "post" : undefined,
    note: x.inferred ? "The post didn’t give the full recipe, so a standard version was filled in. Check the amounts." : undefined,
    origin: "you",
    createdAt: new Date().toISOString(),
  };
}

/** "500 g | Chicken thighs", "2 | Onions", "| Garlic". A line without "|" is taken as a name. */
export function parseIngredientLines(text: string): Ingredient[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      if (!l.includes("|")) return { name: l, qty: null, unit: "" };
      const [amt, ...rest] = l.split("|");
      const name = rest.join("|").trim();
      const m = amt.trim().match(/^([\d.,/½¼¾⅓⅔]+)\s*(.*)$/);
      if (!m) return { name, qty: null, unit: amt.trim() };
      const q = m[1].replace(",", ".");
      const frac: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3 };
      const qty = frac[q] ?? (q.includes("/") ? Number(q.split("/")[0]) / Number(q.split("/")[1]) : Number(q));
      return { name, qty: Number.isFinite(qty) ? qty : null, unit: m[2].trim() };
    })
    .filter((i) => i.name);
}

export function ingredientLines(list: Ingredient[]): string {
  return list.map((i) => `${i.qty == null ? "" : `${i.qty} `}${i.unit}`.trim() + ` | ${i.name}`).join("\n");
}
