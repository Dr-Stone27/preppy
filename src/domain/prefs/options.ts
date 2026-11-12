/**
 * Setup choices. Warnings work by finding these words in a recipe's ingredients and method (whole words, plurals included),
 * so each option lists the words it looks for. Gluten isn't offered: too many flours and noodles can't be told apart by name.
 * Changing an existing option's words makes it look unticked for people who already chose it, so add new options rather than editing old ones.
 */
export const NEVER_OPTIONS: { label: string; terms: string[] }[] = [
  { label: "Seafood", terms: ["seafood", "fish", "prawn", "shrimp", "crayfish"] },
  { label: "Pork", terms: ["pork", "bacon"] },
  { label: "Beef", terms: ["beef"] },
  { label: "Chicken", terms: ["chicken"] },
  { label: "Turkey", terms: ["turkey"] },
  { label: "Goat", terms: ["goat"] },
  { label: "Lamb", terms: ["lamb", "mutton"] },
  { label: "Offal", terms: ["liver", "kidney", "tripe", "shaki", "ponmo", "cow foot", "gizzard"] },
  { label: "Snail", terms: ["snail"] },
  { label: "Eggs in anything", terms: ["egg"] },
  { label: "Fried or boiled eggs", terms: ["fried egg", "boiled egg"] },
  { label: "Dairy", terms: ["milk", "cheese", "butter", "cream", "yoghurt", "yogurt"] },
  { label: "Peanuts", terms: ["peanut", "groundnut"] },
  { label: "Tree nuts", terms: ["almond", "cashew", "walnut", "pecan", "hazelnut", "pistachio"] },
  { label: "Soy", terms: ["soy", "soya", "tofu"] },
  { label: "Sesame", terms: ["sesame", "tahini"] },
  { label: "Coconut", terms: ["coconut"] },
  { label: "Mushrooms", terms: ["mushroom"] },
  { label: "Hot chilli", terms: ["chilli", "chili", "scotch bonnet", "habanero", "cayenne"] },
  { label: "Alcohol", terms: ["wine", "beer", "rum", "brandy", "whisky", "vodka", "sherry"] },
];

export const SIDE_OPTIONS = [
  "Rice", "Brown rice", "Yam", "Pounded yam", "Beans", "Plantain", "Garri", "Amala", "Semo", "Fufu",
  "Bread", "Wraps", "Spaghetti", "Pasta", "Noodles", "Couscous", "Quinoa",
  "Potatoes", "Sweet potatoes", "Chips", "Corn", "Salad", "Coleslaw", "Steamed vegetables",
];

/** An option counts as chosen when all its words are in the list. */
export const hasOption = (never: string[], terms: string[]) => terms.every((t) => never.includes(t));

export function toggleOption(never: string[], terms: string[]): string[] {
  return hasOption(never, terms) ? never.filter((t) => !terms.includes(t)) : [...new Set([...never, ...terms])];
}

/** Words in the list that no option covers, shown as removable chips. */
export const customTerms = (never: string[]) => never.filter((t) => !NEVER_OPTIONS.some((o) => o.terms.includes(t)));
