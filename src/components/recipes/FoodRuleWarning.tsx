"use client";

import { Icon } from "@/components/ui/Icon";
import { ruleWarnings, warningSentence } from "@/domain/recipes/rules";
import type { Recipe } from "@/domain/recipes/types";
import { useData } from "@/state/store";
import styles from "./RecipeView.module.css";

/**
 * The food-rule warning for a recipe, read from this person's own list in the browser.
 * Library pages are drawn on the server, which can't see that list, so they use this.
 */
export function FoodRuleWarning({ recipe }: { recipe: Recipe }) {
  const data = useData();
  const w = ruleWarnings(recipe, data?.prefs.never);
  if (!w.items.length && !w.notes.length) return null;
  return (
    <div className={styles.warning} role="note">
      <Icon name="alert" size={20} />
      <div>
        {w.items.length > 0 && <p>{warningSentence(w.items)}</p>}
        {w.notes.map((n) => (
          <p key={n} className={styles.warningNote}>
            {n}
          </p>
        ))}
      </div>
    </div>
  );
}
