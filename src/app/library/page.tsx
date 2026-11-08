import { LibraryBrowser } from "@/components/recipes/LibraryBrowser";
import { ScreenHeader, Stack } from "@/components/ui/Layout";
import { libraryRecipes } from "@/domain/recipes/library";

export const metadata = { title: "Library · Preppy" };

export default function LibraryPage() {
  return (
    <Stack gap={4}>
      <ScreenHeader title="Library" />
      <LibraryBrowser recipes={libraryRecipes()} />
    </Stack>
  );
}
