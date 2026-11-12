import type { CuisineFamily, RiceStyle } from "./types";

/**
 * Illustration-only colours. Interface colours live in styles/tokens.css.
 * Cuisine colours are the fallback when nothing in the recipe names a sauce.
 */
export const CUISINE_BASE: Record<CuisineFamily, string> = {
  nigerian: "#B83A22",
  korean: "#B23A26",
  chinese: "#9A5427",
  japanese: "#7A4325",
  vietnamese: "#7E4A26",
  ghanaian: "#B4421F",
  indian: "#D27A2A",
  tex_mex: "#C9853A",
  bbq: "#7A2F1C",
  middle_eastern: "#C98B4E",
  caribbean: "#B9663A",
  dessert: "#5B3A2E",
  other: "#B97A4A",
};

/**
 * Sauce colour from what's actually in the dish. First match wins, so the specific comes first:
 * efo is green before it is Nigerian, a curry sauce is gold before it is a stew.
 */
export const SAUCE: [RegExp, string][] = [
  [/egusi/, "#E2C67C"],
  [/efo|spinach.*palm oil|palm oil.*spinach/, "#3E6A33"],
  [/ayamase|green bell pepper/, "#56702C"],
  [/pepper soup/, "#9C4E2A"],
  [/asaro|yam porridge/, "#DD7C2C"],
  [/red red/, "#B4421F"],
  [/honey beans|\bbeans\b/, "#94552F"],
  [/tikka|masala/, "#CF6E28"],
  [/curry goat|jamaican/, "#B5652E"],
  [/curry sauce|chicken curry/, "#D9A33A"],
  [/gochujang|korean/, "#B23A26"],
  [/pineapple|sweet chili|sweet & sour/, "#D4702A"],
  [/honey sesame|kung pao/, "#8E3F1F"],
  [/teriyaki|soy|hoisin|oyster sauce|beijing|shaken/, "#6B3B1F"],
  [/bbq|barbecue/, "#7A2F1C"],
  [/fajita/, "#C9853A"],
  [/shawarma|cucumber yogurt|greek yogurt/, "#E7D6B4"],
  [/cheesesteak/, "#C9A46A"],
  [/stew|tomato|tatashe/, "#B83A22"],
];

/** Dry dishes (fried, roasted, air-fried) sit on a parchment-toned bed rather than a sauce. */
export const DRY = "#EAD9BC";

/** Rice: base, the grain highlight, and a darker grain for the toasted bits. */
export const RICE: Record<RiceStyle, { base: string; grain: string; dark: string }> = {
  white: { base: "#F1E8D8", grain: "#FFFDF8", dark: "#DCCDB4" },
  jollof: { base: "#D2552A", grain: "#EF8A55", dark: "#9E3518" },
  fried: { base: "#E0BE68", grain: "#F5DE9C", dark: "#C49A45" },
};

/** Desserts vary by flavour so a vanilla flan never looks like a chocolate mug cake. */
export const DESSERT_TINT: [RegExp, string][] = [
  [/choc|cocoa|brownie/, "#5B3A2E"],
  [/vanilla|caramel|custard|flan/, "#E6C98A"],
  [/banana/, "#E8C36A"],
  [/cinnamon|nutmeg/, "#C9955B"],
  [/peanut/, "#C08A52"],
  [/moi moi|beans/, "#D98E5A"],
];

/** Glazed stoneware: warm cream body, a fired earth-brown lip, a toasted inner band. */
export const CERAMIC = {
  vessel: "#F6EBDD",
  rim: "#A8714A",
  band: "#EEDCC6",
  bandLine: "#CFAE88",
  shadow: "#3B2A1E",
};

/** The inked look: an espresso line on every piece, a hand-dipped earth rim, a glaze a shade darker than the page. */
export const INKED = {
  ink: "#2B211A",
  vessel: "#8A6446",
  rim: "#6E4E37",
  rimLight: "#B08B6A",
  band: "#EFE4D2",
  shadow: "#3B2A1E",
};

/** Piece and garnish colours. `hi` is the lit side, `lo` the seared or shadowed side. */
export const FOOD = {
  chicken: { fill: "#C98140", hi: "#E7AE68", lo: "#7E4420" },
  chickenPale: { fill: "#E6C79A", hi: "#F4E2C2", lo: "#B98E5C" },
  bone: "#F3E9D6",
  beef: { fill: "#5A311E", hi: "#82503A", lo: "#331A0F" },
  goat: { fill: "#5E3A28", hi: "#86593F", lo: "#3A2216" },
  gizzard: { fill: "#7E2A1E", hi: "#A8483A" },
  wings: { fill: "#B5481F", hi: "#D9733E", lo: "#7A2A12" },
  plantain: { fill: "#E9A13B", hi: "#F6C56A", lo: "#B8661E" },
  yam: { fill: "#F2E2B4", lo: "#D9C58C" },
  bean: "#7A4A33",
  beanHi: "#A06A4C",
  banana: { fill: "#F6E3A1", lo: "#E6CC79" },
  choc: "#2E1C14",
  peanut: { fill: "#D7A86A", lo: "#A87A44" },
  pea: "#7BAA4A",
  carrot: "#EE8B3A",
  leaf: "#4C7656",
  leafLight: "#6E9B63",
  sesame: "#FBF3DE",
  cucumber: { fill: "#D6E6BC", rim: "#4E7A3E" },
  pepperRed: "#D8402A",
  pepperGreen: "#5E8E3A",
  chilli: "#C9281C",
  lime: { fill: "#C9DE78", rind: "#6E9B2A" },
  cabbage: "#DCE9C2",
  cream: "#FBF4E6",
  oil: "#E0461C",
  yolk: "#FFC857",
};

/** Mix a hex colour towards black (amount < 0) or white (amount > 0). */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount),
  );
  return "#" + ch.map((c) => c.toString(16).padStart(2, "0")).join("");
}
