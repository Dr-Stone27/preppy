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
      <ScreenHeader title="This week" />

      <Card className={styles.hero}>
        <div className={styles.collage}>
          {featured.map((r) => (
            <BowlIllustration key={r.id} recipe={r} size={84} decorative />
          ))}
        </div>
        <div className={styles.heroText}>
          <span className="t-eyebrow">Your recipes</span>
          <h2 className="t-h2">{count} dishes saved</h2>
        </div>
        <ButtonLink href="/library" block>
          Browse recipes
        </ButtonLink>
      </Card>

      <EmptyState
        title="No plan this week"
        body="Weekly planning is coming soon."
      />
    </Stack>
  );
}
