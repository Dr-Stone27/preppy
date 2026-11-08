"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ingredientLines, newId, parseIngredientLines } from "@/domain/recipes/import";
import type { Recipe } from "@/domain/recipes/types";
import styles from "./Add.module.css";

type Props = { initial?: Partial<Recipe>; submitLabel: string; onSubmit: (r: Recipe) => void; onCancel?: () => void };

/** Everything a recipe needs, in plain fields. Used to check a read post and to type one in. */
export function RecipeForm({ initial = {}, submitLabel, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [kind, setKind] = useState(initial.kind ?? "main");
  const [servings, setServings] = useState(String(initial.servings ?? 4));
  const [protein, setProtein] = useState(initial.protein ?? "");
  const [flavour, setFlavour] = useState(initial.flavour ?? "");
  const [withCarb, setWithCarb] = useState(!!initial.withCarb);
  const [ing, setIng] = useState(initial.ingredients ? ingredientLines(initial.ingredients) : "");
  const [steps, setSteps] = useState((initial.steps ?? []).join("\n"));
  const [source, setSource] = useState(initial.source ?? "");
  const m = initial.macros ?? {};
  const [kcal, setKcal] = useState(m.kcal?.toString() ?? "");
  const [prot, setProt] = useState(m.protein?.toString() ?? "");
  const [carbs, setCarbs] = useState(m.carbs?.toString() ?? "");
  const [fat, setFat] = useState(m.fat?.toString() ?? "");
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const ingredients = parseIngredientLines(ing);
    if (!title.trim()) return setError("Give the recipe a name.");
    if (!ingredients.length) return setError("Add at least one ingredient.");
    const num = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? undefined : Math.round(Number(v)));
    const macros = { kcal: num(kcal), protein: num(prot), carbs: num(carbs), fat: num(fat) };
    const hasMacros = Object.values(macros).some((v) => v != null);
    const changedMacros = JSON.stringify(macros) !== JSON.stringify({ kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat });
    onSubmit({
      ...initial,
      id: initial.id ?? newId(title),
      title: title.trim(),
      kind: kind === "sweet" ? "sweet" : "main",
      servings: Math.max(1, Number(servings) || 1),
      protein: protein.trim() || undefined,
      flavour: flavour.trim() || undefined,
      withCarb,
      ingredients,
      steps: steps.split("\n").map((s) => s.trim()).filter(Boolean),
      source: source.trim() || undefined,
      macros: hasMacros ? macros : undefined,
      macrosSource: hasMacros ? (changedMacros ? "you" : initial.macrosSource ?? "you") : undefined,
      origin: "you",
      createdAt: initial.createdAt ?? new Date().toISOString(),
    });
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <label className={styles.field}>
        <span>Name</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Gochujang chicken" required />
      </label>
      <div className={styles.pair}>
        <label className={styles.field}>
          <span>Type</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as "main" | "sweet")}>
            <option value="main">Main</option>
            <option value="sweet">Breakfast or sweet</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>Makes</span>
          <input type="number" inputMode="numeric" min={1} value={servings} onChange={(e) => setServings(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Protein</span>
          <input value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="Chicken" />
        </label>
        <label className={styles.field}>
          <span>Flavour</span>
          <input value={flavour} onChange={(e) => setFlavour(e.target.value)} placeholder="Korean" />
        </label>
      </div>
      <label className={styles.check}>
        <input type="checkbox" checked={withCarb} onChange={(e) => setWithCarb(e.target.checked)} />
        Comes with its own rice, pasta or bread, so no side is added
      </label>
      <label className={styles.field}>
        <span>Ingredients</span>
        <textarea rows={8} value={ing} onChange={(e) => setIng(e.target.value)} placeholder={"500 g | Chicken thighs\n2 tbsp | Gochujang\n| Garlic"} />
        <small>One per line: amount, then a bar, then the ingredient.</small>
      </label>
      <label className={styles.field}>
        <span>Method</span>
        <textarea rows={6} value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="One step per line" />
      </label>
      <fieldset className={styles.macros}>
        <legend>Per serving, if the post says</legend>
        <label className={styles.field}>
          <span>kcal</span>
          <input type="number" inputMode="numeric" min={0} value={kcal} onChange={(e) => setKcal(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Protein g</span>
          <input type="number" inputMode="numeric" min={0} value={prot} onChange={(e) => setProt(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Carbs g</span>
          <input type="number" inputMode="numeric" min={0} value={carbs} onChange={(e) => setCarbs(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Fat g</span>
          <input type="number" inputMode="numeric" min={0} value={fat} onChange={(e) => setFat(e.target.value)} />
        </label>
      </fieldset>
      <label className={styles.field}>
        <span>Link</span>
        <input type="url" inputMode="url" value={source} onChange={(e) => setSource(e.target.value)} placeholder="https://www.instagram.com/reel/…" />
      </label>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <Button type="submit" block>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="secondary" block onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
