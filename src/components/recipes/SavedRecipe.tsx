"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Layout";
import { recipeById } from "@/domain/recipes/library";
import { track } from "@/lib/analytics";
import { deleteRecipe, useData } from "@/state/store";
import { RecipeView } from "./RecipeView";
import styles from "./SavedRecipe.module.css";

export function SavedRecipe() {
  const data = useData();
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  if (!data) return <div style={{ minHeight: "60vh" }} aria-busy="true" />;

  const r = recipeById(id);
  if (!r)
    return (
      <EmptyState
        title="Recipe not found"
        body="It may have been deleted, or it was saved on another device."
        action={
          <ButtonLink href="/library" variant="secondary" size="sm">
            Back to library
          </ButtonLink>
        }
      />
    );

  return (
    <RecipeView
      recipe={r}
      never={data.prefs.never}
      footer={
        r.origin === "you" && (
          <div className={styles.delete}>
            {confirming ? (
              <>
                <p className="t-small">Delete this recipe? It also comes out of any round it’s planned in. This can’t be undone.</p>
                <div className={styles.row}>
                  <Button variant="secondary" size="sm" onClick={() => setConfirming(false)}>
                    Keep it
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      deleteRecipe(r.id);
                      track("recipe_deleted");
                      router.replace("/library");
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </>
            ) : (
              <Button variant="text" size="sm" onClick={() => setConfirming(true)}>
                Delete recipe
              </Button>
            )}
          </div>
        )
      }
    />
  );
}
