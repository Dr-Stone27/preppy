import Link from "next/link";
import { cardLabel } from "@/domain/recipes/search";
import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { Tag } from "@/components/ui/Chip";
import { recipeHref } from "@/domain/recipes/library";
import type { Recipe } from "@/domain/recipes/types";
import styles from "./RecipeCard.module.css";

/** Bowl-led recipe card. The whole card opens the recipe. */
export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const m = recipe.macros;
  return (
    <Link href={recipeHref(recipe)} className={styles.card}>
      <BowlIllustration recipe={recipe} size="md" decorative />
      <h3 className={styles.title}>{recipe.title}</h3>
      <div className={styles.meta}>
        <Tag tone="accent">{cardLabel(recipe)}</Tag>
        {m?.protein ? <span className="t-label t-muted">{m.protein} g protein</span> : null}
      </div>
    </Link>
  );
}
