"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { accountsOn } from "@/lib/supabase";
import { listShared } from "@/state/share";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Layout";
import { filterRecipes } from "@/domain/recipes/search";
import { libraryRecipes } from "@/domain/recipes/library";
import type { Recipe } from "@/domain/recipes/types";
import { useData } from "@/state/store";
import { CollectionHead, CollectionsHome, collection } from "./LibraryCollections";
import { RecipeCard } from "./RecipeCard";
import cardStyles from "./RecipeCard.module.css";
import styles from "./LibraryBrowser.module.css";

/**
 * The library: search at the top; otherwise collections (flavour bases, cuisines, sweets, your own, other cooks'),
 * then every recipe. An opened collection lives in the address, so the back gesture returns to the library.
 */
export function LibraryBrowser({ recipes: exported }: { recipes: Recipe[] }) {
  const data = useData();
  const router = useRouter();
  const open = useSearchParams().get("c");
  // Saved recipes register with the library once the store loads in the browser.
  const own = useMemo(() => (data ? libraryRecipes() : exported), [data, exported]);
  const [shared, setShared] = useState<Recipe[] | "loading" | "error" | null>(null);
  const recipes = useMemo(() => (Array.isArray(shared) ? [...own, ...shared] : own), [own, shared]);
  const [typed, setTyped] = useState("");
  const query = useDeferredValue(typed);

  const loadShared = () => {
    setShared("loading");
    listShared()
      .then((list) => setShared((list ?? []).map((s) => s.recipe)))
      .catch(() => setShared("error"));
  };
  useEffect(() => {
    // Other cooks' recipes load only when that collection is opened. Until they arrive, it shows as loading.
    if (open !== "shared" || shared !== null) return;
    let live = true;
    listShared()
      .then((list) => live && setShared((list ?? []).map((s) => s.recipe)))
      .catch(() => live && setShared("error"));
    return () => {
      live = false;
    };
  }, [open, shared]);

  const go = (key: string | null) => {
    setTyped("");
    router.push(key ? `/library?c=${encodeURIComponent(key)}` : "/library");
  };

  const results = useMemo(
    () => (query.trim() ? filterRecipes(recipes, { query, kind: "all", cuisine: "all", base: "all" }) : []),
    [recipes, query],
  );
  const opened = open ? collection(open, recipes) : null;

  const grid = (list: Recipe[]) => (
    <div className={cardStyles.grid}>
      {list.map((r) => (
        <RecipeCard key={r.id} recipe={r} />
      ))}
    </div>
  );

  return (
    <div className={styles.wrap}>
      <label className={styles.search}>
        <Icon name="search" size={20} />
        <span className="visually-hidden">Search recipes</span>
        <input
          type="search"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Search dishes or ingredients"
          autoComplete="off"
          enterKeyHint="search"
        />
        {typed && (
          <button type="button" className={styles.clear} onClick={() => setTyped("")} aria-label="Clear search">
            <Icon name="close" size={18} />
          </button>
        )}
      </label>

      {query.trim() ? (
        <>
          <p className="t-small t-muted" aria-live="polite">
            {results.length === 1 ? "1 recipe" : `${results.length} recipes`}
          </p>
          {results.length ? (
            grid(results)
          ) : (
            <EmptyState title="No matches" body={`Nothing matches “${query.trim()}”. Try another dish or ingredient.`} />
          )}
        </>
      ) : opened ? (
        <>
          <Link href="/library" className={styles.back} onClick={(e) => (e.preventDefault(), go(null))}>
            <Icon name="back" size={18} /> Library
          </Link>
          <CollectionHead collectionKey={open!} recipes={recipes} />
          {open === "shared" && (shared === null || shared === "loading") ? (
            <p className="t-small t-muted" aria-busy="true">
              Loading recipes from other cooks…
            </p>
          ) : open === "shared" && shared === "error" ? (
            <EmptyState
              title="Couldn’t load them"
              body="Check your connection and try again."
              action={
                <Button variant="secondary" size="sm" onClick={loadShared}>
                  Try again
                </Button>
              }
            />
          ) : opened.list.length ? (
            grid(opened.list)
          ) : (
            <EmptyState
              title={open === "shared" ? "Nothing shared yet" : "Nothing here yet"}
              body={open === "shared" ? "When cooks share a recipe they saved, it shows up here. Share one of yours from its page." : "Recipes you save will show up here."}
            />
          )}
        </>
      ) : (
        <>
          <CollectionsHome recipes={own} onOpen={go} showShared={accountsOn} />
          <section className={styles.all}>
            <h2 className="t-h3">Every recipe</h2>
            <p className="t-small t-muted">{own.length} recipes</p>
            {grid(own)}
          </section>
        </>
      )}
    </div>
  );
}
