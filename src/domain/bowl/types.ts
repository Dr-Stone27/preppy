/** Cuisine family: used for filters and as the last-resort sauce colour. Mapping lives in palette.ts. */
export type CuisineFamily =
  | "nigerian"
  | "korean"
  | "chinese"
  | "japanese"
  | "vietnamese"
  | "ghanaian"
  | "indian"
  | "tex_mex"
  | "bbq"
  | "middle_eastern"
  | "caribbean"
  | "dessert"
  | "other";

/**
 * What fills the bowl. Savoury: rice, noodles, a sauce or stew, a soup, beans, porridge.
 * Sweet dishes each have their own shape so a flan never reads as a mug cake.
 */
export type BaseType =
  | "rice"
  | "noodles"
  | "sauce"
  | "soup"
  | "beans"
  | "porridge"
  | "custard"
  | "cake"
  | "oats"
  | "mousse"
  | "pancakes"
  | "flan"
  | "loaf"
  | "toast"
  | "moimoi"
  | "akara";

/** White rice, jollof (tomato-red) or fried rice (curry-gold). */
export type RiceStyle = "white" | "jollof" | "fried";

/** How a soup's surface reads: clear broth, leafy greens, or egusi curds. */
export type SoupStyle = "broth" | "greens" | "egusi";

/** The main pieces, by how they're cut, so strips, bites and a stewed drumstick look different. */
export type PieceType =
  | "chicken"
  | "chicken-strips"
  | "chicken-bites"
  | "wings"
  | "gizzard"
  | "beef"
  | "beef-strips"
  | "mince"
  | "ribs"
  | "goat"
  | "plantain"
  | "yam"
  | "beans"
  | "banana"
  | "choc"
  | "peanuts";

/** Small things scattered on top, only when the recipe has them. */
export type ExtraType = "peas-carrot" | "spring-onion" | "sesame" | "cucumber" | "pepper" | "greens" | "chilli" | "lime" | "cabbage" | "drizzle";

export type BowlSpec = {
  cuisine: CuisineFamily;
  base: BaseType;
  /** The colour of the sauce, stew, soup or dessert filling. */
  color: string;
  rice?: RiceStyle;
  soup?: SoupStyle;
  /** Rice on one side and the sauce on the other, for dishes served over rice. */
  split?: boolean;
  /** Red palm-oil drops on the surface. */
  oil?: boolean;
  pieces: PieceType[];
  extras: ExtraType[];
  /** Stable seed (usually the recipe id) so the composition never reshuffles. */
  seed: string;
};

/** Below ~56px detail is dropped so the bowl stays legible. */
export type Detail = "low" | "mid" | "high";

/** A drawable primitive in the 200×200 bowl coordinate space. */
export type Shape =
  | { kind: "circle"; cx: number; cy: number; r: number; fill: string; opacity?: number; stroke?: string; sw?: number }
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number; rot: number; fill: string; opacity?: number; stroke?: string; sw?: number }
  | { kind: "rect"; x: number; y: number; w: number; h: number; r: number; rot: number; fill: string; opacity?: number; stroke?: string; sw?: number }
  | { kind: "path"; d: string; fill?: string; stroke?: string; sw?: number; opacity?: number };
