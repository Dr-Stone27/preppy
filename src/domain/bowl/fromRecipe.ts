import type { Recipe } from "@/domain/recipes/types";
import { CUISINE_BASE, DESSERT_TINT, DRY, SAUCE } from "./palette";
import type { BaseType, BowlSpec, CuisineFamily, ExtraType, PieceType, RiceStyle, SoupStyle } from "./types";

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

function sweetBase(t: string, text: string): BaseType {
  if (/moi moi/.test(t)) return "moimoi";
  if (/akara/.test(t)) return "akara";
  if (/flan/.test(t)) return "flan";
  if (/mousse/.test(t)) return "mousse";
  if (/pancake/.test(t)) return "pancakes";
  if (/loaf|banana bread/.test(t)) return "loaf";
  if (/toast/.test(t)) return "toast";
  if (/brownie|cake/.test(t)) return "cake";
  if (/oat/.test(text)) return "oats";
  return "custard";
}

function savouryBase(t: string, text: string, withCarb: boolean | undefined): { base: BaseType; rice?: RiceStyle; soup?: SoupStyle; split?: boolean } {
  if (/soup|efo|egusi/.test(t)) return { base: "soup", soup: /egusi/.test(text) ? "egusi" : /efo|spinach|ugu/.test(t) ? "greens" : "broth" };
  if (/porridge|asaro/.test(t)) return { base: "porridge" };
  if (/noodle|spaghetti|pasta|macaroni/.test(t)) return { base: "noodles" };
  if (/red red|beans|ewa/.test(t)) return { base: "beans" };
  if (/jollof/.test(t)) return { base: "rice", rice: "jollof" };
  if (/fried rice/.test(t)) return { base: "rice", rice: "fried" };
  // Served over rice: rice on one side, the sauce and its pieces on the other.
  if (/rice|bowls?\b/.test(t) || (withCarb && /\brice\b/.test(text))) return { base: "sauce", rice: "white", split: true };
  return { base: "sauce" };
}

/** How the main protein is cut, read from the title first and the method words second. */
function proteinPieces(t: string, text: string): PieceType[] {
  if (/gizzard/.test(text)) return ["gizzard"];
  if (/wings?\b/.test(t)) return ["wings"];
  if (/chicken|turkey/.test(text)) {
    if (/fajita|shawarma|strips|sliced|cheesesteak/.test(t)) return ["chicken-strips"];
    if (/bites|kung pao|sesame|pineapple|sweet & sour|popcorn|fried rice/.test(t)) return ["chicken-bites"];
    return ["chicken"];
  }
  if (/goat/.test(text)) return ["goat"];
  if (/minced|mince/.test(text)) return ["mince"];
  if (/ribs/.test(text)) return ["ribs"];
  if (/beef|steak/.test(text)) return /beijing|shaken|cheesesteak|suya|stir|strips|sliced/.test(t) ? ["beef-strips"] : ["beef"];
  return [];
}

/**
 * Derive the bowl for a recipe from what it actually contains.
 * Nothing is hand-drawn per recipe, and nothing is added that the recipe doesn't have.
 */
export function bowlFromRecipe(r: Recipe): BowlSpec {
  const t = r.title.toLowerCase();
  const names = r.ingredients.map((i) => i.name.toLowerCase()).join(" | ");
  const text = `${t} | ${(r.protein ?? "").toLowerCase()} | ${(r.flavour ?? "").toLowerCase()} | ${names}`;
  const cuisine = cuisineOf(r);
  const sweet = r.kind === "sweet";
  const has = (re: RegExp) => re.test(names);

  if (sweet) {
    const base = sweetBase(t, text);
    let color = CUISINE_BASE.dessert;
    for (const [re, c] of DESSERT_TINT) if (re.test(`${r.flavour ?? ""} ${t}`.toLowerCase())) { color = c; break; }
    const pieces: PieceType[] = [];
    if (/banana/.test(text) && base !== "loaf") pieces.push("banana");
    if (/cocoa|chocolate/.test(text) && base !== "cake" && base !== "mousse") pieces.push("choc");
    return { cuisine, base, color, pieces, extras: has(/peanut butter|honey|caramel|syrup/) && base === "oats" ? ["drizzle"] : [], seed: r.id };
  }

  const shape = savouryBase(t, text, r.withCarb);
  let color = CUISINE_BASE[cuisine];
  for (const [re, c] of SAUCE) if (re.test(text)) { color = c; break; }
  if (shape.base === "sauce" && !shape.split && /crispy|fried chicken|air fryer|baked|roast|wings|ribs|bites|gizdodo/.test(t) && !/sauce/.test(t)) color = DRY;

  const pieces = proteinPieces(t, text);
  if (has(/plantain/)) pieces.push("plantain");
  if (shape.base !== "porridge" && has(/\byam\b|potato/)) pieces.push("yam");
  if (shape.base !== "beans" && has(/\bbeans\b|black-eyed/)) pieces.push("beans");
  if (has(/peanut/)) pieces.push("peanuts");

  const extras: ExtraType[] = [];
  if (has(/mixed vegetables|carrot|\bpeas\b/)) extras.push("peas-carrot");
  if (has(/cucumber/)) extras.push("cucumber");
  if (has(/cabbage/)) extras.push("cabbage");
  if (has(/bell pepper|tatashe/) && /fajita|beijing|shaken|stir|bowl|cheesesteak|pepper(ed)?\b/.test(t)) extras.push("pepper");
  if (shape.base === "soup" || shape.base === "porridge" ? has(/ugu|scent lea|spinach/) : has(/spinach|kale|watercress|pak choi/)) extras.push("greens");
  if (has(/dried red chil/)) extras.push("chilli");
  if (has(/\blimes?\b/)) extras.push("lime");
  if (has(/yogurt/) && !/shawarma/.test(t)) extras.push("drizzle");
  if (has(/spring onion|scallion|green onion/)) extras.push("spring-onion");
  if (has(/sesame seeds/)) extras.push("sesame");

  return { cuisine, ...shape, color, oil: has(/palm oil/) && shape.base !== "beans" ? true : undefined, pieces: pieces.slice(0, 3), extras, seed: r.id };
}
