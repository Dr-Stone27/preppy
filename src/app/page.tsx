import Link from "next/link";
import { BowlCollage } from "@/components/bowl/BowlCollage";
import { HomeWeek } from "@/components/home/HomeWeek";
import { Icon } from "@/components/ui/Icon";
import { ScreenHeader, Stack } from "@/components/ui/Layout";
import { myRecipes, recipeById } from "@/domain/recipes/library";
import styles from "./page.module.css";

const FEATURED = ["suya-jollof-rice-with-beef-suya-npq6", "korean-sweet-chili-minced-beef", "vanilla-caramel-flan-cup"];

export default function Home() {
  const count = myRecipes().length;
  const featured = FEATURED.map(recipeById).filter((r) => r !== undefined);

  return (
    <Stack gap={4}>
      <ScreenHeader title="This week" />
      <HomeWeek />
      <Link href="/library" className={styles.library}>
        <BowlCollage recipes={featured} size={44} />
        <span className={styles.libraryText}>
          <span className={styles.libraryTitle}>Your recipes</span>
          <span className="t-label t-muted">{count} dishes saved</span>
        </span>
        <Icon name="chevron" size={18} />
      </Link>
    </Stack>
  );
}
