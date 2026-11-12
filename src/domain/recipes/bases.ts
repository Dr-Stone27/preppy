import { slug } from "@/domain/plan/week";
import type { Recipe } from "./types";

/**
 * Flavour bases: the part of a dish that sets its taste, which a cook can make once and use for several dishes.
 * A dish's base is read from its ingredients, so saved recipes get one too. The rules are checked in order;
 * the first that fits wins. Sweet dishes match none of the rules, so they have no base; savoury breakfasts can. See docs/flavour-bases-draft.md for the reasoning per dish.
 */
export type BaseId = "pepper" | "palm" | "curry" | "pepper-soup" | "soy" | "yogurt" | "rub";

export type Base = { id: BaseId; name: string; about: string; /** How to make it once for several dishes. */ once: string };

export const BASES: Base[] = [
  { id: "pepper", name: "Pepper base", about: "Tatashe, scotch bonnet and onion, often with tomatoes, blended and fried down in oil until the oil rises.", once: "Blend the peppers, tomatoes and onions in one go, fry it down once, then divide it." },
  { id: "palm", name: "Palm oil base", about: "Palm oil with onion, pepper, and usually iru and crayfish. Earthy, deep red.", once: "Heat the palm oil and fry the onion, pepper and iru once, then divide it." },
  { id: "curry", name: "Curry and thyme", about: "Curry powder and dried thyme cooked into oil with onion. Lighter than the pepper base.", once: "Fry the onion with the curry and thyme once, then divide it." },
  { id: "pepper-soup", name: "Pepper soup", about: "Meat simmered with pepper soup spice, ginger and garlic, finished with scent leaf.", once: "Make one pot of spiced broth, then divide it." },
  { id: "soy", name: "Soy, garlic and ginger", about: "Soy sauce with garlic and ginger, something sweet, and often something hot or tart.", once: "Grate all the garlic and ginger at once and mix the sauces side by side." },
  { id: "yogurt", name: "Yogurt and warm spice", about: "Yogurt, lemon and garlic with cumin, coriander, paprika and chilli.", once: "Mix one big batch of the yogurt and spice, then divide it." },
  { id: "rub", name: "Garlic and paprika rub", about: "A dry rub of garlic, paprika and pepper, sometimes finished with a sticky sauce.", once: "Mix the rub once in a bowl, then divide it." },
];

const byId = new Map(BASES.map((b) => [b.id, b]));
export const baseById = (id: BaseId) => byId.get(id)!;

const any = (k: Set<string>, ...ids: string[]) => ids.some((id) => k.has(id));

export function baseOf(r: Recipe): BaseId | null {
  const k = new Set(r.ingredients.map((i) => slug(i.name)));
  if (k.has("nigerian-pepper-soup-spice")) return "pepper-soup";
  if (k.has("palm-oil")) return "palm";
  if (any(k, "greek-yogurt", "yogurt", "plain-yogurt") && any(k, "cumin", "garam-masala", "ground-coriander", "kashmiri-chilli-powder"))
    return "yogurt";
  if (any(k, "light-soy-sauce", "dark-soy-sauce", "soy-sauce", "gochujang", "oyster-sauce") && !k.has("bbq-sauce")) return "soy";
  if (k.has("tatashe") || ((k.has("scotch-bonnet-rodo") || k.has("tomato-paste")) && k.has("tomatoes"))) return "pepper";
  if (k.has("curry-powder") && k.has("dried-thyme")) return "curry";
  if (any(k, "garlic-powder", "smoked-paprika", "sweet-paprika", "fajita-seasoning", "all-purpose-chicken-seasoning")) return "rub";
  return null;
}

/** Bases present among these recipes, in the fixed order above. */
export const basesIn = (recipes: Recipe[]): Base[] => {
  const seen = new Set(recipes.map(baseOf));
  return BASES.filter((b) => seen.has(b.id));
};

/**
 * Swaps for when you're missing something. `close`: you'd hardly notice. Otherwise it works but changes the taste.
 * Keys are pantry ids, or the slug of something typed in ("basil", "mozzarella").
 */
export type Swap = { use: string; close: boolean };

const SWAPS: Record<string, Swap[]> = {};
const add = (from: string, use: string, close: boolean) => (SWAPS[from] ??= []).push({ use, close });
const both = (a: string, b: string, close: boolean) => (add(a, b, close), add(b, a, close));

both("tatashe", "bell-peppers", true);
both("ugu", "spinach", true);
both("limes", "lemon-juice", true);
both("honey", "brown-sugar", true);
both("white-sugar", "brown-sugar", true);
both("cayenne-pepper", "chili-flakes", true);
both("potato-starch", "cornstarch", true);
both("olive-oil", "vegetable-oil", true);
both("whole-milk", "skim-milk", true);
both("chicken-thighs", "chicken-breast", false);
both("smoked-paprika", "sweet-paprika", false);
both("light-soy-sauce", "dark-soy-sauce", false);
add("greek-yogurt", "plain-yogurt", true);
add("greek-yogurt", "yogurt", true);
add("provolone-cheese", "mozzarella", true);
add("rice-vinegar", "apple-cider-vinegar", true);
add("rice-vinegar", "limes", true);
add("kashmiri-chilli-powder", "sweet-paprika", true);
add("dried-thyme", "thyme", true);
add("dried-thyme", "fresh-thyme", true);
add("scotch-bonnet-rodo", "chili-flakes", false);
add("scotch-bonnet-rodo", "cayenne-pepper", false);
add("scent-leaves", "basil", false);
add("ginger", "ginger-powder", false);
add("garlic", "garlic-powder", false);
add("spring-onions", "onions", false);
add("palm-oil", "vegetable-oil", false);
add("oyster-sauce", "hoisin-sauce", false);
add("gochujang", "sriracha", false);
add("gochugaru", "chili-flakes", false);
add("garam-masala", "curry-powder", false);
add("bbq-sauce", "ketchup", false);
add("evaporated-milk", "whole-milk", false);

/** The first swap for `key` that `have` says you have, or undefined. */
export function swapFor(key: string, have: (key: string) => boolean): Swap | undefined {
  return SWAPS[key]?.find((s) => have(s.use));
}
