import type { CuisineFamily, ToppingType } from "./types";

/**
 * Illustration-only colours. Interface colours live in styles/tokens.css.
 * Base colours for nigerian, korean, chinese, indian, tex_mex and dessert come from the design handoff;
 * the others extend it for flavours already in the library.
 */
export const CUISINE_BASE: Record<CuisineFamily, string> = {
  nigerian: "#D9774A",
  korean: "#C8553D",
  chinese: "#D9A441",
  japanese: "#D98F7E",
  indian: "#E0A526",
  tex_mex: "#C9A227",
  bbq: "#9A5B3A",
  middle_eastern: "#C98B4E",
  caribbean: "#B9663A",
  dessert: "#5B3A2E",
  other: "#C4946A",
};

/** Desserts vary by flavour so a vanilla flan never looks like a chocolate mug cake. */
const DESSERT_TINT: [RegExp, string][] = [
  [/choc|cocoa|brownie/, "#5B3A2E"],
  [/vanilla|caramel|custard|flan/, "#E6C98A"],
  [/banana/, "#E8C36A"],
  [/cinnamon|nutmeg/, "#C9955B"],
  [/peanut/, "#C08A52"],
  [/moi moi|beans/, "#D98E5A"],
];

export function baseColor(cuisine: CuisineFamily, tint?: string): string {
  if (cuisine === "dessert" && tint) {
    const t = tint.toLowerCase();
    for (const [re, c] of DESSERT_TINT) if (re.test(t)) return c;
  }
  return CUISINE_BASE[cuisine];
}

/** Glazed stoneware: warm cream body, a fired earth-brown lip, a toasted inner band. */
export const CERAMIC = {
  vessel: "#F6EBDD",
  rim: "#A8714A",
  band: "#EEDCC6",
  bandLine: "#CFAE88",
  shadow: "#3B2A1E",
};

export const TOPPING_COLOR: Record<ToppingType, { fill: string; edge?: string }> = {
  chicken: { fill: "#F4E8D1", edge: "#E6D3B3" },
  beef: { fill: "#3A2618" },
  goat: { fill: "#4E3021" },
  beans: { fill: "#7A4E3B" },
  egg: { fill: "#FFFDF9", edge: "#EFE6D6" },
  plantain: { fill: "#F2B544", edge: "#D9952A" },
  yam: { fill: "#F3E6C4", edge: "#E2D2A6" },
  vegetable: { fill: "#4C7656" },
  pepper: { fill: "#E14B2F" },
  banana: { fill: "#F6E3A1", edge: "#E6CC79" },
  choc: { fill: "#2E1C14" },
  garnish: { fill: "#4C7656" },
};

export const YOLK = "#FFC857";
export const LEAF_LIGHT = "#6E9B63";

/** Mix a hex colour towards black (amount < 0) or white (amount > 0). */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount),
  );
  return "#" + ch.map((c) => c.toString(16).padStart(2, "0")).join("");
}
