import { Suspense } from "react";
import { SharedRecipe } from "@/components/recipes/SharedRecipe";

export const metadata = { title: "Recipe · Preppy" };

/** A recipe another cook shared. It's loaded in the browser from the shared library. */
export default function SharedRecipePage() {
  return (
    <Suspense>
      <SharedRecipe />
    </Suspense>
  );
}
