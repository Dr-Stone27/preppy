import { RecipeCard } from "@/components/recipes/RecipeCard";
import cardStyles from "@/components/recipes/RecipeCard.module.css";
import { ScreenHeader, Stack } from "@/components/ui/Layout";
import { myRecipes } from "@/domain/recipes/library";

export const metadata = { title: "Library · Preppy" };

export default function LibraryPage() {
  const recipes = myRecipes();
  return (
    <Stack gap={6}>
      <ScreenHeader eyebrow={`${recipes.length} recipes`} title="Library" />
      <div className={cardStyles.grid}>
        {recipes.map((r) => (
          <RecipeCard key={r.id} recipe={r} />
        ))}
      </div>
    </Stack>
  );
}
