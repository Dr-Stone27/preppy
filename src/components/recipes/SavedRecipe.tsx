"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Layout";
import { recipeById } from "@/domain/recipes/library";
import { deleteRecipe, useData } from "@/state/store";
import { unshareRecipe } from "@/state/share";
import { RecipeView } from "./RecipeView";
import { ShareRecipe } from "./ShareRecipe";
import styles from "./SavedRecipe.module.css";

export function SavedRecipe() {
  const data = useData();
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (confirming) confirmRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [confirming]);
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
          <>
          {r.copiedFrom && (
            <p className="t-small t-muted">
              Saved from another cook{r.sharedBy ? `, ${r.sharedBy}` : ""}. It’s your copy: it stays even if they stop sharing it.
            </p>
          )}
          <ShareRecipe recipe={r} />
          <div className={styles.delete}>
            {confirming ? (
              <div ref={confirmRef} className={styles.confirm}>
                <p className="t-small">Delete this recipe? It also comes out of any cook it’s planned in, and out of the library if you shared it. This can’t be undone.</p>
                <div className={styles.row}>
                  <Button variant="secondary" size="sm" onClick={() => setConfirming(false)}>
                    Keep it
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      // Deleting a shared recipe also takes it out of the library.
                      unshareRecipe(r.id).catch(() => {});
                      deleteRecipe(r.id);
                      router.replace("/library");
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="text" size="sm" onClick={() => setConfirming(true)}>
                Delete recipe
              </Button>
            )}
          </div>
          </>
        )
      }
    />
  );
}
