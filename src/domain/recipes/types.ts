/** Recipe shape carried over from Prep Week (content/starter-library.json). */
export type RecipeKind = "main" | "sweet";

export type Ingredient = { name: string; qty: number | null; unit: string };

export type Macros = { kcal?: number; protein?: number; carbs?: number; fat?: number };

export type Recipe = {
  id: string;
  title: string;
  kind: RecipeKind;
  protein?: string;
  flavour?: string;
  servings: number;
  withCarb?: boolean;
  ingredients: Ingredient[];
  steps: string[];
  source?: string;
  note?: string;
  flags?: string[];
  /** Present only when the post stated them or an estimate was made; never invented. */
  macros?: Macros;
  macrosSource?: "post" | "estimate" | "you";
  credit?: { name: string; url: string };
  /** "you" marks a recipe saved on this device. */
  origin?: "owner-library" | "preppy-starter" | "you" | "shared";
  /** On a saved copy of a shared recipe: the shared row it came from. Copies can't be shared again. */
  copiedFrom?: string;
  /** On a shared recipe or a copy of one: the first name its sharer chose to show. */
  sharedBy?: string;
  createdAt?: string;
};
