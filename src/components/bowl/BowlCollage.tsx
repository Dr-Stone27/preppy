import type { Recipe } from "@/domain/recipes/types";
import { BowlIllustration } from "./BowlIllustration";

/** Up to four overlapping bowls, for a round or a set of dishes. */
export function BowlCollage({ recipes, size = 56 }: { recipes: Recipe[]; size?: number }) {
  if (!recipes.length) return null;
  return (
    <div style={{ display: "flex", flex: "none" }} aria-hidden>
      {recipes.slice(0, 4).map((r, i) => (
        <div key={r.id} style={{ marginLeft: i ? -size * 0.28 : 0 }}>
          <BowlIllustration recipe={r} size={size} decorative />
        </div>
      ))}
    </div>
  );
}
