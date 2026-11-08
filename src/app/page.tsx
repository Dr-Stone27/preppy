import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { ButtonLink } from "@/components/ui/Button";
import { Card, EmptyState, ScreenHeader, Stack } from "@/components/ui/Layout";
import { myRecipes, recipeById } from "@/domain/recipes/library";
import styles from "./page.module.css";

const FEATURED = ["suya-jollof-rice-with-beef-suya-npq6", "korean-sweet-chili-minced-beef", "vanilla-caramel-flan-cup"];

export default function Home() {
  const count = myRecipes().length;
  const featured = FEATURED.map(recipeById).filter((r) => r !== undefined);

  return (
    <Stack gap={6}>
      <ScreenHeader eyebrow="Preppy" title="This week" />

      <Card className={styles.hero}>
        <div className={styles.collage}>
          {featured.map((r) => (
            <BowlIllustration key={r.id} recipe={r} size={84} decorative />
          ))}
        </div>
        <div className={styles.heroText}>
          <span className="t-eyebrow">Your library</span>
          <h2 className="t-h2">{count} recipes, moved over from Prep Week</h2>
          <p className="t-small t-muted">Every dish now has its own bowl, drawn from what it actually contains.</p>
        </div>
        <ButtonLink href="/library" block>
          Open your library
        </ButtonLink>
      </Card>

      <EmptyState
        title="Nothing planned yet"
        body="Rounds, your shopping list and cook day move over in the next build. Until then, keep planning in Prep Week."
      />
    </Stack>
  );
}
