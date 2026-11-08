import type { Recipe } from "./types";

/**
 * Food rules carried over from Prep Week's preferences.
 * Becomes per-user settings when accounts land; until then these are the owner's.
 */
export const NEVER_DEFAULT = ["fried egg", "boiled egg", "fish", "seafood", "prawn", "shrimp", "crayfish"];

const SEAFOOD = ["oyster sauce", "fish sauce", "shrimp", "prawn", "crayfish", "anchov", "crab", "lobster", "squid", "calamari", "mussel", "clam"];

function searchable(r: Recipe) {
  return [r.title, ...r.ingredients.map((i) => i.name), ...r.steps].join(" ").toLowerCase();
}

/**
 * What in this recipe breaks the user's food rules.
 * `items` are short names ("oyster sauce"); `notes` are longer flags saved with the recipe at import.
 */
export function ruleWarnings(r: Recipe, never: string[] = NEVER_DEFAULT): { items: string[]; notes: string[] } {
  const text = searchable(r);
  const found = never.map((n) => n.toLowerCase()).filter((n) => n && text.includes(n));
  if (never.includes("seafood")) for (const w of SEAFOOD) if (text.includes(w)) found.push(w);
  const notes: string[] = [];
  for (const f of r.flags ?? []) {
    if (f.length > 40) notes.push(f);
    else found.push(f.toLowerCase());
  }
  const unique = [...new Set(found)];
  // "fish" adds nothing when "fish sauce" is already listed.
  const items = unique.filter((w) => !unique.some((o) => o !== w && o.includes(w)));
  return { items, notes };
}

/** "oyster sauce" → "Contains oyster sauce, which you don't eat." */
export function warningSentence(hits: string[]): string {
  const list = hits.length > 1 ? `${hits.slice(0, -1).join(", ")} and ${hits.at(-1)}` : hits[0];
  return `Contains ${list}, which you don't eat.`;
}
