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

/**
 * Bowl size for a collage on a screen's hero card: 160px (the hero minimum) when it fits a phone-width card,
 * smaller once three or more overlapping bowls would overflow it.
 */
export function heroBowlSize(count: number, width = 276) {
  const n = Math.max(1, Math.min(count, 4));
  // DESIGN.md: one or two bowls at 160px; more overlap and shrink to fit, never below 88px.
  return Math.max(88, Math.min(160, Math.floor(width / (1 + 0.72 * (n - 1)))));
}
