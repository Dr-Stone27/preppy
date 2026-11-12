import { BOWL_SIZES, BowlIllustration, type BowlSize } from "@/components/bowl/BowlIllustration";
import { Card, ScreenHeader, SectionHeader, Stack } from "@/components/ui/Layout";
import { bowlFromRecipe } from "@/domain/bowl/fromRecipe";
import { allRecipes, recipeById } from "@/domain/recipes/library";
import { notFound } from "next/navigation";
import styles from "./bowls.module.css";

export const metadata = { title: "Bowl gallery · Preppy" };

const SHOWCASE = ["party-jollof-rice-chicken", "korean-sweet-chili-minced-beef", "vanilla-caramel-flan-cup"];

/** Review page for the bowl engine: three reference dishes at every size, then every recipe. */
export default function BowlGallery() {
  if (process.env.NODE_ENV === "production") notFound();
  const showcase = SHOWCASE.map(recipeById).filter((r) => r !== undefined);
  const all = allRecipes();
  return (
    <Stack gap={8}>
      <ScreenHeader eyebrow="Design review" title="Bowl gallery" />
      {showcase.map((r) => {
        const spec = bowlFromRecipe(r);
        return (
          <Card key={r.id}>
            <Stack gap={4}>
              <div>
                <h2 className="t-h3">{r.title}</h2>
                <p className="t-label t-muted">
                  {spec.cuisine} · {spec.base}
                  {spec.rice ? ` (${spec.rice}${spec.split ? ", beside the sauce" : ""})` : ""} · {[...spec.pieces, ...spec.extras].join(", ") || "nothing on top"}
                </p>
              </div>
              <div className={styles.sizes}>
                {(Object.keys(BOWL_SIZES) as BowlSize[]).map((s) => (
                  <figure key={s} className={styles.size}>
                    <BowlIllustration recipe={r} size={s} />
                    <figcaption className="t-label t-muted">
                      {s} · {BOWL_SIZES[s]}px
                    </figcaption>
                  </figure>
                ))}
              </div>
            </Stack>
          </Card>
        );
      })}
      <SectionHeader title="Every recipe" meta={`${all.length} bowls`} />
      <div className={styles.all}>
        {all.map((r) => (
          <figure key={r.id} className={styles.cell}>
            <BowlIllustration recipe={r} size="lg" />
            <figcaption className="t-label">{r.title}</figcaption>
          </figure>
        ))}
      </div>
    </Stack>
  );
}
