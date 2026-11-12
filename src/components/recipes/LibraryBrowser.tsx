"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { accountsOn } from "@/lib/supabase";
import { listShared } from "@/state/share";
import { FilterChip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Layout";
import type { CuisineFamily } from "@/domain/bowl/types";
import { baseById, basesIn } from "@/domain/recipes/bases";
import { CUISINE_LABEL, cuisinesIn, filterRecipes, type LibraryFilter } from "@/domain/recipes/search";
import { libraryRecipes } from "@/domain/recipes/library";
import type { Recipe } from "@/domain/recipes/types";
import { useData } from "@/state/store";
import { RecipeCard } from "./RecipeCard";
import cardStyles from "./RecipeCard.module.css";
import styles from "./LibraryBrowser.module.css";

const KINDS: { value: LibraryFilter["kind"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "main", label: "Mains" },
  { value: "sweet", label: "Breakfast & sweets" },
];

const EMPTY: LibraryFilter = { query: "", kind: "all", cuisine: "all", base: "all" };

export function LibraryBrowser({ recipes: exported }: { recipes: Recipe[] }) {
  const data = useData();
  // Saved recipes register with the library once the store loads in the browser.
  const [shared, setShared] = useState<Recipe[] | "loading" | "error" | null>(null);
  const own = useMemo(() => (data ? libraryRecipes() : exported), [data, exported]);
  const recipes = useMemo(() => (Array.isArray(shared) ? [...own, ...shared] : own), [own, shared]);
  const loadShared = () => {
    if (shared !== null && shared !== "error") return;
    setShared("loading");
    listShared()
      .then((list) => setShared((list ?? []).map((s) => s.recipe)))
      .catch(() => setShared("error"));
  };
  const [filter, setFilter] = useState<LibraryFilter>(EMPTY);
  const query = useDeferredValue(filter.query);
  const cuisines = useMemo(() => cuisinesIn(recipes), [recipes]);
  const bases = useMemo(() => basesIn(recipes), [recipes]);
  const shown = useMemo(() => filterRecipes(recipes, { ...filter, query }), [recipes, filter, query]);
  const filtered = filter.query !== "" || filter.kind !== "all" || filter.cuisine !== "all" || filter.base !== "all";

  const set = (patch: Partial<LibraryFilter>) => setFilter((f) => ({ ...f, ...patch }));

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <label className={styles.search}>
          <Icon name="search" size={20} />
          <span className="visually-hidden">Search recipes</span>
          <input
            type="search"
            value={filter.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Search dishes or ingredients"
            autoComplete="off"
            enterKeyHint="search"
          />
          {filter.query && (
            <button type="button" className={styles.clear} onClick={() => set({ query: "" })} aria-label="Clear search">
              <Icon name="close" size={18} />
            </button>
          )}
        </label>

        <div className={styles.chips} role="group" aria-label="Type">
          {[
            ...KINDS,
            ...(recipes.some((r) => r.origin === "you") ? [{ value: "you" as const, label: "Saved by you" }] : []),
            ...(accountsOn ? [{ value: "shared" as const, label: "From other cooks" }] : []),
          ].map((k) => (
            <FilterChip
              key={k.value}
              selected={filter.kind === k.value}
              onClick={() => {
                if (k.value === "shared") loadShared();
                set({ kind: k.value, ...(k.value === "sweet" ? { cuisine: "all", base: "all" } : {}) });
              }}
            >
              {k.label}
            </FilterChip>
          ))}
        </div>

        {filter.kind !== "sweet" && cuisines.length > 1 && (
          <div className={styles.filterRow}>
            <span className="t-label t-muted">By cuisine</span>
            <div className={styles.chips} role="group" aria-label="Cuisine">
              {cuisines.map((c: CuisineFamily) => (
                <FilterChip key={c} selected={filter.cuisine === c} onClick={() => set({ cuisine: filter.cuisine === c ? "all" : c })}>
                  {CUISINE_LABEL[c]}
                </FilterChip>
              ))}
            </div>
          </div>
        )}

        {filter.kind !== "sweet" && bases.length > 1 && (
          <div className={styles.filterRow}>
            <span className="t-label t-muted">By flavour</span>
            <div className={styles.chips} role="group" aria-label="Flavour">
              {bases.map((b) => (
                <FilterChip key={b.id} selected={filter.base === b.id} onClick={() => set({ base: filter.base === b.id ? "all" : b.id })}>
                  {b.name}
                </FilterChip>
              ))}
            </div>
            {filter.base && filter.base !== "all" && <p className="t-small t-muted">{baseById(filter.base).about}</p>}
          </div>
        )}
      </div>

      <p className="t-small t-muted" aria-live="polite">
        {filter.kind === "shared"
          ? Array.isArray(shared) && shared.length > 0
            ? `${shown.length} shared by other cooks`
            : ""
          : filtered
            ? `${shown.length} of ${own.length} recipes`
            : `${own.length} recipes`}
      </p>

      {filter.kind === "shared" && shared === "loading" ? (
        <p className="t-small t-muted" aria-busy="true">Loading recipes from other cooks…</p>
      ) : filter.kind === "shared" && shared === "error" ? (
        <EmptyState
          title="Couldn’t load them"
          body="Check your connection and try again."
          action={
            <Button variant="secondary" size="sm" onClick={loadShared}>
              Try again
            </Button>
          }
        />
      ) : filter.kind === "shared" && !recipes.some((r) => r.origin === "shared") ? (
        <EmptyState title="Nothing shared yet" body="When cooks share a recipe they saved, it shows up here. Share one of yours from its page." />
      ) : shown.length > 0 ? (
        <div className={cardStyles.grid}>
          {shown.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No matches"
          body={filter.query ? `Nothing matches “${filter.query.trim()}”. Try another dish or ingredient.` : "No recipes match these filters."}
          action={
            <Button variant="secondary" size="sm" onClick={() => setFilter(EMPTY)}>
              Clear filters
            </Button>
          }
        />
      )}
    </div>
  );
}
