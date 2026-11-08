import type { Recipe } from "./types";


const SEAFOOD = ["oyster sauce", "fish sauce", "shrimp", "prawn", "crayfish", "anchov", "crab", "lobster", "squid", "calamari", "mussel", "clam"];

function searchable(r: Recipe) {
  return [r.title, ...r.ingredients.map((i) => i.name), ...r.steps].join(" ").toLowerCase();
}

/**
 * What in this recipe breaks this person's food rules.
 * `items` are short names ("oyster sauce"), found from their own list only.
 * `notes` are longer remarks saved with the recipe at import, shown to everyone.
 * Short flags on shared library recipes came from the owner's rules, so only a person's own saved recipes use them.
 */
export function ruleWarnings(r: Recipe, never: string[] = []): { items: string[]; notes: string[] } {
  const text = searchable(r);
  const found = never.map((n) => n.toLowerCase()).filter((n) => n && text.includes(n));
  if (never.includes("seafood")) for (const w of SEAFOOD) if (text.includes(w)) found.push(w);
  const notes: string[] = [];
  for (const f of r.flags ?? []) {
    if (f.length > 40) notes.push(f);
    else if (r.origin === "you") found.push(f.toLowerCase()); // flagged against this person's own list when they saved it
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
