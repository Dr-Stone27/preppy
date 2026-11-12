"use client";

import { supabase } from "@/lib/supabase";
import type { Ingredient, Recipe } from "@/domain/recipes/types";
import { currentData, saveRecipe } from "./store";

/** A recipe another cook chose to share. `recipe.id` is "shared-<row id>" so it never clashes with saved ones. */
export type Shared = { id: string; recipe: Recipe; sharedBy: string | null; mine: boolean; createdAt: string; /** The sharer's own recipe id, used only when it's yours. */ recipeId: string };

type Row = { id: string; owner: string; recipe_id: string; recipe: unknown; shared_by: string | null; created_at: string };

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const webLink = (v: unknown) => {
  try {
    const u = new URL(String(v));
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Rebuilds a shared recipe from what's stored, keeping only the fields a recipe has and only web links.
 * Anything stored is written by someone else, so nothing is trusted as it comes.
 */
function clean(raw: unknown, id: string): Recipe | null {
  const r = raw as Record<string, unknown>;
  if (!r || typeof r !== "object") return null;
  const title = str(r.title, 120)?.trim();
  const ingredients = Array.isArray(r.ingredients)
    ? r.ingredients.slice(0, 60).flatMap((i): Ingredient[] => {
        const name = str((i as Ingredient)?.name, 80)?.trim();
        return name ? [{ name, qty: num((i as Ingredient).qty) ?? null, unit: str((i as Ingredient).unit, 40) ?? "" }] : [];
      })
    : [];
  const steps = Array.isArray(r.steps) ? r.steps.slice(0, 40).flatMap((s) => (typeof s === "string" && s.trim() ? [s.slice(0, 800)] : [])) : [];
  if (!title || !ingredients.length || !steps.length) return null;
  const m = (r.macros ?? {}) as Record<string, unknown>;
  const macros = { kcal: num(m.kcal), protein: num(m.protein), carbs: num(m.carbs), fat: num(m.fat) };
  const credit = r.credit as { name?: unknown; url?: unknown } | undefined;
  const creditUrl = credit && webLink(credit.url);
  return {
    id: `shared-${id}`,
    title,
    kind: r.kind === "sweet" ? "sweet" : "main",
    protein: str(r.protein, 40),
    flavour: str(r.flavour, 40),
    servings: Math.min(50, Math.max(1, Math.round(num(r.servings) ?? 1))),
    withCarb: r.withCarb === true,
    ingredients,
    steps,
    source: webLink(r.source),
    note: str(r.note, 600),
    macros: Object.values(macros).some((v) => v !== undefined) ? macros : undefined,
    macrosSource: r.macrosSource === "post" || r.macrosSource === "estimate" || r.macrosSource === "you" ? r.macrosSource : undefined,
    credit: creditUrl && str(credit!.name, 60) ? { name: str(credit!.name, 60)!, url: creditUrl } : undefined,
    origin: "shared",
  };
}

async function me() {
  const s = supabase();
  if (!s) return null;
  const { data } = await s.auth.getSession();
  return data.session?.user.id ?? null;
}

function toShared(row: Row, uid: string | null): Shared | null {
  const recipe = clean(row.recipe, row.id);
  return recipe ? { id: row.id, recipe, sharedBy: row.shared_by, mine: row.owner === uid, createdAt: row.created_at, recipeId: row.recipe_id } : null;
}

/** The newest shared recipes. Null when accounts aren't switched on. */
export async function listShared(limit = 60): Promise<Shared[] | null> {
  const s = supabase();
  if (!s) return null;
  const [uid, { data, error }] = await Promise.all([
    me(),
    s.from("shared_recipes").select("id, owner, recipe_id, recipe, shared_by, created_at").eq("hidden", false).order("created_at", { ascending: false }).limit(limit),
  ]);
  if (error) throw error;
  return (data as Row[]).flatMap((row) => toShared(row, uid) ?? []);
}

export async function getShared(id: string): Promise<Shared | null> {
  const s = supabase();
  if (!s || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [uid, { data, error }] = await Promise.all([me(), s.from("shared_recipes").select("id, owner, recipe_id, recipe, shared_by, created_at").eq("id", id).maybeSingle()]);
  if (error) throw error;
  return data ? toShared(data as Row, uid) : null;
}

/** Whether this saved recipe is shared from this account, and the row it's shared as. */
export async function shareOf(recipeId: string): Promise<{ id: string; sharedBy: string | null; hidden: boolean } | null> {
  const s = supabase();
  const uid = await me();
  if (!s || !uid) return null;
  const { data, error } = await s.from("shared_recipes").select("id, shared_by, hidden").eq("owner", uid).eq("recipe_id", recipeId).maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, sharedBy: data.shared_by, hidden: data.hidden } : null;
}

/** Only the recipe itself goes out: no food-rule flags, dates or where it came from on this device. */
function forSharing(r: Recipe) {
  const { title, kind, protein, flavour, servings, withCarb, ingredients, steps, source, note, macros, macrosSource, credit } = r;
  return { title, kind, protein, flavour, servings, withCarb, ingredients, steps, source, note, macros, macrosSource, credit };
}

export async function shareRecipe(r: Recipe, sharedBy: string) {
  const s = supabase();
  if (!s || !(await me())) throw new Error("sign-in");
  const name = sharedBy.trim().slice(0, 30) || null;
  const { error } = await s.from("shared_recipes").upsert({ recipe_id: r.id, recipe: forSharing(r), shared_by: name }, { onConflict: "owner,recipe_id" });
  if (error) throw error;
}

export async function unshareRecipe(recipeId: string) {
  const s = supabase();
  const uid = await me();
  if (!s || !uid) return;
  const { error } = await s.from("shared_recipes").delete().eq("owner", uid).eq("recipe_id", recipeId);
  if (error) throw error;
}

export async function reportShared(id: string, reason: string) {
  const s = supabase();
  if (!s || !(await me())) throw new Error("sign-in");
  const { error } = await s.from("recipe_reports").insert({ recipe: id, reason: reason.trim().slice(0, 300) || null });
  // Reporting twice is fine: the first one counts.
  if (error && error.code !== "23505") throw error;
}

/** Your saved copy of a shared recipe, if you've saved it. */
export const savedCopyOf = (sharedId: string) => currentData().recipes.find((r) => r.copiedFrom === sharedId);

/** Saves a shared recipe into your own recipes, so it can be planned like any other and stays if the sharer removes it. */
export function saveSharedCopy(s: Shared): Recipe {
  const existing = savedCopyOf(s.id);
  if (existing) return existing;
  const copy: Recipe = {
    ...s.recipe,
    id: `${s.recipe.id.replace(/^shared-/, "copy-")}`,
    origin: "you",
    copiedFrom: s.id,
    sharedBy: s.sharedBy ?? undefined,
    createdAt: new Date().toISOString(),
  };
  saveRecipe(copy);
  return copy;
}
