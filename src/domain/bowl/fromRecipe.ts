import type { Recipe } from "@/domain/recipes/types";
import type { BaseType, BowlSpec, BowlTopping, CuisineFamily, ToppingType } from "./types";

/** Flavour label → cuisine family. First match wins; order matters. */
const FAMILY_RULES: [RegExp, CuisineFamily][] = [
  [/ghanaian|red red/, "ghanaian"],
  [/nigerian|suya|pepper(ed)?|west african|jollof/, "nigerian"],
  [/caribbean|jamaican/, "caribbean"],
  [/vietnamese/, "vietnamese"],
  [/korean|gochujang/, "korean"],
  [/chinese|sweet chili|kung pao|sesame/, "chinese"],
  [/japanese|teriyaki/, "japanese"],
  [/indian|curry|masala|tikka/, "indian"],
  [/tex-?mex|mexican|fajita/, "tex_mex"],
  [/bbq|american|cheesesteak/, "bbq"],
  [/shawarma|middle eastern|lebanese/, "middle_eastern"],
];

const SWEET_FLAVOURS = /chocolate|vanilla|banana|cinnamon|peanut butter|nutmeg|caramel|honey/;

export function cuisineOf(recipe: Pick<Recipe, "flavour" | "kind" | "title">): CuisineFamily {
  const f = `${recipe.flavour ?? ""} ${recipe.title}`.toLowerCase();
  if (recipe.kind === "sweet") {
    // Savoury breakfasts (moi moi, akara) keep their cuisine colour.
    if (!SWEET_FLAVOURS.test(f) && /nigerian/.test(f)) return "nigerian";
    return "dessert";
  }
  for (const [re, fam] of FAMILY_RULES) if (re.test(f)) return fam;
  return "other";
}

function baseOf(r: Recipe, text: string): BaseType {
  const t = r.title.toLowerCase();
  if (r.kind === "sweet") {
    if (/oat/.test(text) && !/pancake|bread|souffl/.test(t)) return "oats";
    if (/pancake|bread|cake|brownie|loaf|toast|akara/.test(t)) return "cake";
    return "custard";
  }
  if (/soup/.test(t)) return "soup";
  if (/noodle|spaghetti|pasta|macaroni/.test(t)) return "noodles";
  if (/red red|beans|ewa/.test(t)) return "beans";
  if (/rice|jollof|bowls?\b/.test(t) || (r.withCarb && /\brice\b/.test(text))) return "rice";
  return "stew";
}

const TOPPING_RULES: [RegExp, ToppingType][] = [
  [/chicken|turkey|gizzard/, "chicken"],
  [/goat/, "goat"],
  [/beef|steak|minced|mince|ribs/, "beef"],
  [/plantain/, "plantain"],
  [/\byam\b|potato/, "yam"],
  [/spinach|ugu|efo|kale|cabbage|cucumber|mixed vegetables|watercress|pak choi|scent lea/, "vegetable"],
  [/bell pepper|tatashe|green pepper/, "pepper"],
  [/banana/, "banana"],
  [/cocoa|chocolate/, "choc"],
];

/**
 * Derive the bowl for a recipe from what it actually contains.
 * Nothing is hand-drawn per recipe, and nothing is added that the recipe doesn't have.
 */
export function bowlFromRecipe(r: Recipe): BowlSpec {
  const names = r.ingredients.map((i) => i.name.toLowerCase()).join(" | ");
  const text = `${r.title.toLowerCase()} | ${(r.protein ?? "").toLowerCase()} | ${names}`;
  const base = baseOf(r, text);
  const seen = new Set<ToppingType>();
  const toppings: BowlTopping[] = [];
  for (const [re, type] of TOPPING_RULES) {
    if (re.test(text) && !seen.has(type)) {
      seen.add(type);
      toppings.push({ type });
    }
  }
  // Beans show as the base when the dish is beans; otherwise as a topping.
  if (base !== "beans" && /\bbeans\b|black-eyed/.test(text) && r.kind === "main") toppings.push({ type: "beans" });
  // Eggs appear only in sweets, where they are part of the dish rather than a fried egg on top.
  if (r.kind === "sweet" && /\beggs?\b/.test(names) && base !== "cake") toppings.unshift({ type: "egg" });
  const capped = toppings.slice(0, 3);
  if (/spring onion|scallion|coriander|parsley|green onion|scent lea|basil/.test(text)) {
    capped.push({ type: "garnish" });
  }
  return { cuisine: cuisineOf(r), base, toppings: capped, tint: `${r.flavour ?? ""} ${r.title}`, seed: r.id };
}
