"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { scaleIngredients } from "@/domain/recipes/scale";
import type { Ingredient } from "@/domain/recipes/types";
import styles from "./Ingredients.module.css";

const MAX = 24;

/** Ingredient list with a servings stepper. Amounts rescale from the recipe's own serving count. */
export function Ingredients({ ingredients, servings }: { ingredients: Ingredient[]; servings: number }) {
  const base = servings || 1;
  const [count, setCount] = useState(base);
  const rows = scaleIngredients(ingredients, base, count);

  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <h2 className="t-h2">Ingredients</h2>
        <div className={styles.stepper} role="group" aria-label="Servings">
          <button type="button" onClick={() => setCount((c) => Math.max(1, c - 1))} disabled={count <= 1} aria-label="Fewer portions">
            <Icon name="minus" size={18} />
          </button>
          <span aria-live="polite">
            {count} {count === 1 ? "portion" : "portions"}
          </span>
          <button type="button" onClick={() => setCount((c) => Math.min(MAX, c + 1))} disabled={count >= MAX} aria-label="More portions">
            <Icon name="plus" size={18} />
          </button>
        </div>
      </div>
      <ul className={styles.list}>
        {rows.map((row, i) => (
          <li key={i}>
            <span>{row.name}</span>
            {row.amount && <span className={styles.amount}>{row.amount}</span>}
          </li>
        ))}
      </ul>
      {count !== base && (
        <button type="button" className={styles.reset} onClick={() => setCount(base)}>
          Back to {base} portions
        </button>
      )}
    </section>
  );
}
