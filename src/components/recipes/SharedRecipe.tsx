"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Layout";
import { track } from "@/lib/analytics";
import { recipeHref } from "@/domain/recipes/library";
import { getShared, reportShared, savedCopyOf, saveSharedCopy, type Shared } from "@/state/share";
import { useData } from "@/state/store";
import { useSync } from "@/state/sync";
import { RecipeView } from "./RecipeView";
import styles from "./ShareRecipe.module.css";

/** A recipe another cook shared: read it, save your own copy to plan with, or report it. */
export function SharedRecipe() {
  const id = useSearchParams().get("id") ?? "";
  const data = useData();
  const sync = useSync();
  const router = useRouter();
  const [shared, setShared] = useState<Shared | null | "loading" | "error">("loading");
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [reported, setReported] = useState("");

  useEffect(() => {
    let live = true;
    getShared(id)
      .then((s) => live && setShared(s))
      .catch(() => live && setShared("error"));
    return () => {
      live = false;
    };
  }, [id]);

  if (!data || shared === "loading") return <div style={{ minHeight: "60vh" }} aria-busy="true" />;
  if (shared === "error" || !shared)
    return (
      <EmptyState
        title={shared === "error" ? "Couldn’t load this recipe" : "Recipe not found"}
        body={shared === "error" ? "Check your connection and try again." : "The cook who shared it may have stopped sharing it."}
        action={
          <ButtonLink href="/library" variant="secondary" size="sm">
            Back to library
          </ButtonLink>
        }
      />
    );

  const copy = savedCopyOf(shared.id);
  const save = () => {
    const c = saveSharedCopy(shared);
    track("shared_recipe_saved");
    router.push(recipeHref(c));
  };
  const report = async () => {
    try {
      await reportShared(shared.id, reason);
      track("recipe_reported");
      setReporting(false);
      setReported("Thanks. Recipes reported by several cooks are hidden until they’re checked.");
    } catch {
      setReported("Couldn’t send that just now. Try again in a moment.");
    }
  };

  return (
    <RecipeView
      recipe={shared.recipe}
      never={data.prefs.never}
      footer={
        <>
          <section className={styles.box}>
            <p className="t-small">
              {shared.mine ? "You shared this recipe." : `Shared by ${shared.sharedBy || "a Preppy cook"}.`} Save it to plan it in a cook. Your copy is yours to keep.
            </p>
            {copy ? (
              <ButtonLink href={recipeHref(copy)} variant="secondary" block>
                Saved. Open your copy
              </ButtonLink>
            ) : shared.mine ? (
              <ButtonLink href={`/library/saved?id=${encodeURIComponent(shared.recipeId)}`} variant="secondary" block>
                Open your recipe
              </ButtonLink>
            ) : (
              <Button block onClick={save}>
                Save to my recipes
              </Button>
            )}
          </section>

          {!shared.mine && (
            <section className={styles.box}>
              {reported ? (
                <p className="t-small" role="status">
                  {reported}
                </p>
              ) : !sync.email ? (
                <p className="t-small t-muted">
                  Something wrong with this recipe? <Link href="/account">Sign in</Link> to report it.
                </p>
              ) : reporting ? (
                <>
                  <label className={styles.field}>
                    <span className="t-label">What’s wrong with it? (optional)</span>
                    <input value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} placeholder="Offensive, spam, not a recipe…" />
                  </label>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <Button variant="secondary" size="sm" onClick={() => setReporting(false)}>
                      Cancel
                    </Button>
                    <Button variant="danger" size="sm" onClick={report}>
                      Report
                    </Button>
                  </div>
                </>
              ) : (
                <Button variant="text" size="sm" onClick={() => setReporting(true)}>
                  Report this recipe
                </Button>
              )}
            </section>
          )}
        </>
      }
    />
  );
}
