import type { IconName } from "@/components/ui/Icon";

/** The icon for something on a shopping or pantry list, by how it's kept: a bag, tin, bottle, shaker, cube or pot. */
export function itemIcon(name: string, group: string): IconName {
  const n = name.toLowerCase();
  if (group === "Produce") return "produce";
  if (group === "Protein" && !/beans/.test(n)) return "protein";
  if (group === "Dairy" && !/butter|evaporated|condensed/.test(n)) return "dairy";
  if (/cube/.test(n)) return "cube";
  if (/paste|evaporated|condensed|broth|tinned|canned/.test(n)) return "tin";
  if (/butter|honey|mayonnaise|mustard|gochujang|jam/.test(n)) return "pot";
  if (/bay leaf|thyme|oregano|parsley|rosemary|basil/.test(n)) return "produce";
  if (/\boil\b|spray/.test(n)) return "oil";
  if (group === "Sauces" || /juice|extract|vinegar|sauce/.test(n)) return "sauces";
  if (group === "Spices") return "spices";
  if (group === "Carbs" || group === "Baking" || group === "Protein" || /egusi|nuts|peanuts|makhana|powder/.test(n)) return "bag";
  return "other";
}
