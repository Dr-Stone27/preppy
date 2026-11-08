"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { FilterChip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Layout";
import type { CuisineFamily } from "@/domain/bowl/types";
import { CUISINE_LABEL, cuisinesIn, filterRecipes, type LibraryFilter } from "@/domain/recipes/search";
import { myRecipes } from "@/domain/recipes/library";
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

const EMPTY: LibraryFilter = { query: "", kind: "all", cuisine: "all" };

export function LibraryBrowser({ recipes: exported }: { recipes: Recipe[] }) {
  const data = useData();
  // Saved recipes register with the library once the store loads in the browser.
  const recipes = useMemo(() => (data ? myRecipes() : exported), [data, exported]);
  const [filter, setFilter] = useState<LibraryFilter>(EMPTY);
  const query = useDeferredValue(filter.query);
  const cuisines = useMemo(() => cuisinesIn(recipes), [recipes]);
  const shown = useMemo(() => filterRecipes(recipes, { ...filter, query }), [recipes, filter, query]);
  const filtered = filter.query !== "" || filter.kind !== "all" || filter.cuisine !== "all";

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
          {KINDS.map((k) => (
            <FilterChip key={k.value} selected={filter.kind === k.value} onClick={() => set({ kind: k.value, cuisine: k.value === "sweet" ? "all" : filter.cuisine })}>
              {k.label}
            </FilterChip>
          ))}
        </div>

        {filter.kind !== "sweet" && cuisines.length > 1 && (
          <div className={styles.chips} role="group" aria-label="Cuisine">
            {cuisines.map((c: CuisineFamily) => (
              <FilterChip key={c} selected={filter.cuisine === c} onClick={() => set({ cuisine: filter.cuisine === c ? "all" : c })}>
                {CUISINE_LABEL[c]}
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      <p className="t-small t-muted" aria-live="polite">
        {filtered ? `${shown.length} of ${recipes.length} recipes` : `${recipes.length} recipes`}
      </p>

      {shown.length > 0 ? (
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
