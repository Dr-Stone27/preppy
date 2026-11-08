/**
 * Setup choices. Warnings work by finding these words in a recipe's ingredients and method,
 * so each option lists the words it looks for. Options that can't be found that way (dairy, gluten) aren't offered.
 */
export const NEVER_OPTIONS: { label: string; terms: string[] }[] = [
  { label: "Seafood", terms: ["seafood", "fish", "prawn", "shrimp", "crayfish"] },
  { label: "Pork", terms: ["pork", "bacon"] },
  { label: "Beef", terms: ["beef"] },
  { label: "Goat", terms: ["goat"] },
  { label: "Eggs on their own", terms: ["fried egg", "boiled egg"] },
  { label: "Peanuts", terms: ["peanut", "groundnut"] },
  { label: "Mushrooms", terms: ["mushroom"] },
];

export const SIDE_OPTIONS = ["Rice", "Yam", "Beans", "Plantain", "Garri", "Bread", "Spaghetti", "Potatoes", "Sweet potatoes", "Noodles"];

/** An option counts as chosen when all its words are in the list. */
export const hasOption = (never: string[], terms: string[]) => terms.every((t) => never.includes(t));

export function toggleOption(never: string[], terms: string[]): string[] {
  return hasOption(never, terms) ? never.filter((t) => !terms.includes(t)) : [...new Set([...never, ...terms])];
}

/** Words in the list that no option covers, shown as removable chips. */
export const customTerms = (never: string[]) => never.filter((t) => !NEVER_OPTIONS.some((o) => o.terms.includes(t)));
