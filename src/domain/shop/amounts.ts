import { formatQty } from "@/domain/recipes/scale";

/**
 * Shopping amounts. Recipes write units the way a cook reads them ("small clove, grated", "g cooked",
 * "teaspoon", "whole, grated and squeezed dry"). A shopping list needs one plain unit per amount,
 * whole numbers for things bought by count, and the size shops sell things in.
 */

/** Marks a unit that means "no measured amount" ("to taste", "for frying"). */
export const LOOSE = "\u0000loose";

const MEASURES: Record<string, string> = {
  g: "g", gram: "g", grams: "g", kg: "kg", ml: "ml", l: "l", litre: "l", litres: "l", liter: "l", liters: "l",
  tsp: "tsp", teaspoon: "tsp", teaspoons: "tsp", tbsp: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp",
  cup: "cup", cups: "cup", oz: "oz", lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
  clove: "clove", cloves: "clove", piece: "piece", pieces: "piece", slice: "slice", slices: "slice",
  stalk: "stalk", stalks: "stalk", packet: "packet", packets: "packet", scoop: "scoop", scoops: "scoop",
  cube: "cube", cubes: "cube", leaf: "leaf", leaves: "leaf", rack: "rack", racks: "rack", handful: "handful",
  thumb: "thumb", thumbs: "thumb", pinch: "pinch", bunch: "bunch", can: "can", tin: "can", sprig: "sprig", sprigs: "sprig",
};

/** True for a word that is a unit of measure ("g", "tbsp", "cloves"). */
export const isMeasure = (w: string) => w.toLowerCase() in MEASURES;

/** Words that describe the thing rather than measure it: "medium", "whole", "red" mean a count of the item. */
const DESCRIBERS = new Set(["small", "medium", "large", "big", "whole", "persian", "red", "white", "green", "yellow", "ripe", "fresh"]);

const LOOSE_PHRASE = /^(to taste|as needed|to garnish|to sprinkle|to serve|for\b|optional|chopped|minced|sliced|finely|roughly)/;

/** One plain unit for a recipe's unit text: "small clove, grated" → "clove", "g cooked" → "g", "medium red" → "" (a count). */
export function normUnit(raw: string): string {
  let s = (raw ?? "").toLowerCase().replace(/\([^)]*\)/g, " ").split(",")[0].replace(/\s+/g, " ").trim();
  if (!s) return "";
  if (LOOSE_PHRASE.test(s)) return LOOSE;
  if (s.startsWith("inch")) return "thumb";
  const words = s.split(" ");
  while (words.length && DESCRIBERS.has(words[0])) words.shift();
  if (!words.length) return "";
  s = words[0];
  return MEASURES[s] ?? "";
}

const SPOONS = new Set(["tsp", "tbsp", "pinch"]);
const WEIGHTS = new Set(["g", "kg", "ml", "l", "oz", "lb", "cup"]);

const PLURAL: Record<string, string> = { leaf: "leaves", bunch: "bunches", pinch: "pinches", handful: "handfuls", can: "cans" };
const unitWord = (u: string, n: number) => (WEIGHTS.has(u) || SPOONS.has(u) || !u ? u : n > 1 ? (PLURAL[u] ?? `${u}s`) : u);

/** "2 cloves", "1.2 kg", "3" */
function say(n: number, u: string) {
  let q = n;
  let unit = u;
  if ((u === "g" || u === "ml") && q >= 1000) {
    q /= 1000;
    unit = u === "g" ? "kg" : "l";
  }
  const counted = !unit || !(WEIGHTS.has(unit) || SPOONS.has(unit));
  const shown = counted ? String(Math.max(1, Math.ceil(q - 0.05))) : formatQty(q, unit);
  return `${shown} ${unitWord(unit, Number(shown) || q)}`.trim();
}

/**
 * How some fresh things are sold. `per` converts the recipe unit into the selling unit;
 * anything measured in a way we can't convert falls back to the plain amount.
 */
const SOLD_AS: Record<string, { sold: string; per: Record<string, number> }> = {
  garlic: { sold: "bulb", per: { clove: 10, "": 10 } },
  "spring-onions": { sold: "bunch", per: { "": 8, stalk: 8 } },
  ginger: { sold: "piece", per: { thumb: 2, piece: 1, "": 1 } },
  "fresh-coriander": { sold: "bunch", per: { "": 1, handful: 2, sprig: 20, bunch: 1 } },
  "scent-leaves": { sold: "bunch", per: { "": 1, handful: 2, leaf: 30, bunch: 1 } },
  ugu: { sold: "bunch", per: { "": 1, handful: 2, bunch: 1 } },
  spinach: { sold: "bunch", per: { handful: 3, bunch: 1 } },
  watercress: { sold: "bunch", per: { "": 1, handful: 3, bunch: 1 } },
};

export type ShopAmount = { text: string; need?: string };

/**
 * The amount to buy. `amounts` is unit → total from the recipes; `loose` means some recipe gave no amount.
 * Spoonfuls of fresh food are left out (they come from what you buy anyway), and "to taste" extras are
 * dropped when there's already a real amount.
 */
export function shopAmount(key: string, amounts: Map<string, number>, loose: boolean, fresh: boolean): ShopAmount {
  const entries = [...amounts].filter(([u, q]) => q > 0 && !(fresh && SPOONS.has(u) && amounts.size > 1));
  const plain = entries.map(([u, q]) => say(q, u)).join(" + ");

  const conv = SOLD_AS[key];
  if (conv && entries.length) {
    let units = 0;
    let ok = true;
    for (const [u, q] of entries) {
      if (conv.per[u] === undefined) {
        if (SPOONS.has(u)) continue; // a spoon of paste or chopped herbs: the bulb or bunch covers it
        ok = false;
        break;
      }
      units += q / conv.per[u];
    }
    if (ok && (units > 0 || entries.every(([u]) => SPOONS.has(u)))) {
      const n = Math.max(1, Math.ceil(units - 0.05));
      return { text: `${n} ${unitWord(conv.sold, n)}`, need: plain ? `recipes use ${plain}` : undefined };
    }
  }
  if (plain) return { text: plain };
  return { text: loose ? "as needed" : "" };
}
