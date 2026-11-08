/** Cuisine family drives the bowl's base colour. Mapping lives in palette.ts. */
export type CuisineFamily =
  | "nigerian"
  | "korean"
  | "chinese"
  | "japanese"
  | "indian"
  | "tex_mex"
  | "bbq"
  | "middle_eastern"
  | "caribbean"
  | "dessert"
  | "other";

/** What fills the bowl underneath the toppings. */
export type BaseType = "rice" | "noodles" | "stew" | "soup" | "beans" | "custard" | "cake" | "oats";

export type ToppingType =
  | "chicken"
  | "beef"
  | "goat"
  | "beans"
  | "egg"
  | "plantain"
  | "yam"
  | "vegetable"
  | "pepper"
  | "banana"
  | "choc"
  | "garnish";

export type BowlTopping = { type: ToppingType; quantity?: number };

export type BowlSpec = {
  cuisine: CuisineFamily;
  base: BaseType;
  toppings: BowlTopping[];
  /** Optional flavour tint, used for desserts (vanilla, banana, chocolate…). */
  tint?: string;
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
