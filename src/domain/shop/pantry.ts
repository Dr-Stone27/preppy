import data from "@/data/starter-library.json";

export type Stock = "have" | "low" | "out";
export type PantryItem = { id: string; name: string; group: string; fresh: boolean };

export const GROUPS = ["Protein", "Dairy", "Carbs", "Produce", "Fats & oils", "Baking", "Spices", "Sauces", "Other"];

/** The order lists are shown in: fresh food first, then the aisles you walk to last. */
export const SHOP_ORDER = ["Produce", "Protein", "Dairy", "Carbs", "Fats & oils", "Baking", "Spices", "Sauces", "Other"];

/** A group name the app knows, or "Other". */
export const groupOf = (g?: string) => (g && SHOP_ORDER.includes(g) ? g : "Other");

const items = (data as unknown as { pantry: PantryItem[] }).pantry;
const byId = new Map(items.map((p) => [p.id, p]));

export const pantryItems = () => items;
export const pantryItem = (id: string) => byId.get(id);

/** Finds the pantry item a typed name means ("Eggs", "egg", "olive oil"), or undefined. */
export function pantryMatch(name: string): PantryItem | undefined {
  const k = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return byId.get(k) ?? byId.get(k.replace(/s$/, "")) ?? byId.get(`${k}s`);
}

export const stockOf = (statuses: Record<string, Stock>, id: string): Stock => statuses[id] ?? "out";

export const NEXT_STOCK: Record<Stock, Stock> = { have: "low", low: "out", out: "have" };
export const STOCK_LABEL: Record<Stock, string> = { have: "Have", low: "Low", out: "Out" };

/**
 * A best guess at the food type of something typed into the list that isn't in the pantry.
 * Phrases are checked first ("black pepper" is a spice, "bell pepper" is produce), then single words.
 * Anything it doesn't know stays under Other, which is also right for non-food.
 */
const WORDS: [string, string[]][] = [
  ["Spices", ["black pepper", "white pepper", "paprika", "cumin", "turmeric", "curry", "cinnamon", "nutmeg", "cardamom", "seasoning", "maggi", "knorr", "bouillon", "stock cube", "salt", "oregano", "rosemary", "thyme", "bay leaf", "bay leaves", "spice", "masala", "cayenne"]],
  ["Sauces", ["sauce", "ketchup", "mayonnaise", "mayo", "mustard", "vinegar", "soy", "gochujang", "sriracha", "tomato paste", "paste", "honey", "jam", "syrup", "dressing", "relish"]],
  ["Fats & oils", ["oil", "ghee", "margarine", "lard", "shortening"]],
  ["Baking", ["flour", "sugar", "yeast", "baking", "cocoa", "vanilla", "custard", "icing", "sprinkles", "cornstarch", "cornflour"]],
  ["Dairy", ["milk", "cheese", "cheddar", "mozzarella", "parmesan", "yoghurt", "yogurt", "butter", "cream", "egg"]],
  ["Protein", ["chicken", "beef", "pork", "lamb", "goat", "turkey", "fish", "tilapia", "salmon", "tuna", "sardine", "prawn", "shrimp", "crab", "sausage", "bacon", "ham", "mince", "steak", "liver", "tofu", "gizzard", "meat"]],
  ["Carbs", ["rice", "bread", "pasta", "spaghetti", "noodle", "yam", "garri", "semo", "oat", "cereal", "couscous", "quinoa", "tortilla", "wrap", "cornflake", "fufu", "amala", "beans", "potato", "macaroni"]],
  ["Produce", ["tomato", "onion", "pepper", "garlic", "ginger", "carrot", "cabbage", "lettuce", "cucumber", "spinach", "ugu", "vegetable", "plantain", "banana", "apple", "orange", "lemon", "lime", "mango", "pineapple", "avocado", "mushroom", "broccoli", "cauliflower", "celery", "parsley", "basil", "mint", "coriander", "scallion", "chilli", "chili", "okra", "pumpkin", "berry", "berries", "grape", "watermelon", "fruit", "herb", "zucchini", "courgette", "corn", "pea", "kale"]],
];

export function guessGroup(name: string): string {
  const text = ` ${name.toLowerCase().replace(/[^a-z ]+/g, " ")} `;
  const singular = (w: string) => w.replace(/(ies)$/, "y").replace(/(es|s)$/, "");
  const words = new Set(text.split(" ").filter(Boolean).flatMap((w) => [w, singular(w)]));
  for (const [group, list] of WORDS)
    for (const k of list) if (k.includes(" ") ? text.includes(` ${k}`) : words.has(k)) return group;
  return "Other";
}
