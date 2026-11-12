import { slug } from "@/domain/plan/week";
import { isMeasure } from "@/domain/shop/amounts";
import type { Ingredient, Macros, Recipe } from "./types";

/** The iOS Shortcut shares "link\ncaption" for an Instagram or TikTok post. Returns null for anything else. */
export const POST_LINK = /https?:\/\/((www|m|vm|vt)\.)?(instagram|tiktok)\.com\/\S+/i;

/** Separates the caption candidates the iPhone Shortcut sends. Must match SEP in tools/build-shortcut.py. */
export const SHARED_SEP = "\n---preppy---\n";

/** A post page's summary, minus the wrapping: "12 likes, 3 comments - cook on 1 Nov: "…"" or "Cook on Instagram: "…"". */
function cleanCaption(raw: string) {
  return raw
    // Instagram's embed page: the username link, then the caption with <br /> for line breaks and links for hashtags.
    .replace(/<a [^>]*class="CaptionUsername"[^>]*>[\s\S]*?<\/a>/i, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim()
    .replace(/^[\d.,]+[KkMm]? likes?, [\d.,]+[KkMm]? comments? - [^:]{1,80}: "/, "")
    .replace(/^[^:\n]{1,80} on (Instagram|TikTok): "/i, "")
    .replace(/"\.?\s*$/, "")
    .trim();
}

export function parseShared(raw: string): { link: string; caption: string } | null {
  const lines = raw.replace(/\r/g, "").split("\n");
  const first = (lines[0] ?? "").trim();
  if (POST_LINK.exec(first)?.index !== 0) return null;
  // The Shortcut sends several versions of the caption; Instagram trims some of them, so keep the longest.
  const caption = lines
    .slice(1)
    .join("\n")
    .split(SHARED_SEP.trim())
    .map(cleanCaption)
    .reduce((best, c) => (c.length > best.length ? c : best), "");
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

const FRAC: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 };

/** "1", "1.5", "1,5", "1/2", "½", "1½", "1 1/2" → a number, or null. */
function readQty(q: string): number | null {
  const t = q.trim().replace(",", ".");
  const mixed = t.match(/^(\d+)\s*([½¼¾⅓⅔⅛]|\d+\/\d+)$/);
  if (mixed) return Number(mixed[1]) + (readQty(mixed[2]) ?? 0);
  if (t in FRAC) return FRAC[t];
  if (t.includes("/")) {
    const [n, d] = t.split("/").map(Number);
    return d ? n / d : null;
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const QTY = "(\\d+\\s+\\d+\\/\\d+|\\d+\\s*[½¼¾⅓⅔⅛]|[\\d.,]+\\/\\d+|[\\d.,]+|[½¼¾⅓⅔⅛])";

/**
 * One ingredient per line, written the way people type: "500 g chicken thighs", "2 onions", "3 cloves garlic", "salt".
 * The older "500 g | Chicken thighs" form still works, and is what's shown for amounts with longer units.
 */
export function parseIngredientLines(text: string): Ingredient[] {
  return text
    .split("\n")
    .map((l) => l.trim().replace(/^[-•*]\s*/, ""))
    .filter(Boolean)
    .map((l): Ingredient => {
      if (l.includes("|")) {
        const [amt, ...rest] = l.split("|");
        const name = rest.join("|").trim();
        const m = amt.trim().match(new RegExp(`^${QTY}\\s*(.*)$`));
        if (!m) return { name, qty: null, unit: amt.trim() };
        return { name, qty: readQty(m[1]), unit: m[2].trim() };
      }
      const m = l.match(new RegExp(`^${QTY}\\s*(.*)$`));
      if (!m) return { name: l, qty: null, unit: "" };
      const rest = m[2].trim().split(/\s+/);
      const unit = rest.length > 1 && isMeasure(rest[0]) ? rest.shift()! : "";
      if (rest[0] === "of") rest.shift();
      return { name: rest.join(" "), qty: readQty(m[1]), unit };
    })
    .filter((i) => i.name);
}

/** Back to text for editing: plain lines where the unit is simple, the "|" form where it isn't. */
export function ingredientLines(list: Ingredient[]): string {
  return list
    .map((i) => {
      const amt = `${i.qty == null ? "" : `${i.qty} `}${i.unit}`.trim();
      if (!amt) return i.name;
      return !i.unit || isMeasure(i.unit) ? `${amt} ${i.name}` : `${amt} | ${i.name}`;
    })
    .join("\n");
}
