import { Suspense } from "react";
import { SavedRecipe } from "@/components/recipes/SavedRecipe";

export const metadata = { title: "Recipe · Preppy" };

/** Recipes saved on this device live in the browser, so this page renders on the client. */
export default function SavedRecipePage() {
  return (
    <Suspense>
      <SavedRecipe />
    </Suspense>
  );
}
