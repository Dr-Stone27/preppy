import Link from "next/link";
import { BowlCollage } from "@/components/bowl/BowlCollage";
import { GettingStarted } from "@/components/home/GettingStarted";
import { HomeWeek } from "@/components/home/HomeWeek";
import { AvatarLink } from "@/components/account/Avatar";
import { Icon } from "@/components/ui/Icon";
import { ScreenHeader, Stack } from "@/components/ui/Layout";
import { recipeById } from "@/domain/recipes/library";
import styles from "./page.module.css";

const FEATURED = ["suya-jollof-rice-with-beef-suya-npq6", "korean-sweet-chili-minced-beef", "vanilla-caramel-flan-cup"];

export default function Home() {
  const featured = FEATURED.map(recipeById).filter((r) => r !== undefined);

  return (
    <Stack gap={4}>
      <ScreenHeader
        title="This week"
        action={
          <AvatarLink />
        }
      />
      <GettingStarted />
      <HomeWeek />
      <Link href="/what-can-i-make" className={styles.library}>
        <span className={styles.haveIcon} aria-hidden>
          <Icon name="search" size={22} />
        </span>
        <span className={styles.libraryText}>
          <span className={styles.libraryTitle}>What can I make?</span>
          <span className="t-label t-muted">Start from what’s in your fridge</span>
        </span>
        <Icon name="chevron" size={18} />
      </Link>
      <Link href="/library" className={styles.library}>
        <BowlCollage recipes={featured} size={44} />
        <span className={styles.libraryText}>
          <span className={styles.libraryTitle}>Recipe library</span>
          <span className="t-label t-muted">Browse and search every dish</span>
        </span>
        <Icon name="chevron" size={18} />
      </Link>
    </Stack>
  );
}
