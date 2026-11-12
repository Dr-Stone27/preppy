"use client";

import { useMemo, useState } from "react";
import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { Icon } from "@/components/ui/Icon";
import { cuisineOf } from "@/domain/bowl/fromRecipe";
import type { CuisineFamily } from "@/domain/bowl/types";
import { baseOf, basesIn, type Base, type BaseId } from "@/domain/recipes/bases";
import { libraryRecipes } from "@/domain/recipes/library";
import { CUISINE_LABEL, cuisinesIn } from "@/domain/recipes/search";
import type { Recipe } from "@/domain/recipes/types";
import { useData } from "@/state/store";
import { RecipeCard } from "./RecipeCard";
import cardStyles from "./RecipeCard.module.css";
import styles from "./LibraryCollections.module.css";

/** Each flavour base gets its own soft card colour, from the interface tokens. */
const BASE_TINT: Record<BaseId, string> = {
  pepper: "var(--color-danger-soft)",
  palm: "var(--color-accent-soft)",
  curry: "var(--color-warning-soft)",
  "pepper-soup": "var(--color-surface-subtle)",
  soy: "var(--color-action-soft)",
  yogurt: "var(--color-success-soft)",
  rub: "var(--color-accent-soft)",
};

type Open = { kind: "base"; base: Base } | { kind: "cuisine"; cuisine: CuisineFamily } | { kind: "sweet" } | null;

/** The dishes that best stand for a collection go first: mains, and rice dishes first among those. */
const covers = (list: Recipe[]) =>
  [...list].sort((a, b) => Number(b.kind === "main") - Number(a.kind === "main") || Number(/jollof|rice/i.test(b.title)) - Number(/jollof|rice/i.test(a.title)));

const count = (n: number) => (n === 1 ? "1 dish" : `${n} dishes`);

/** The library as collections: flavour bases as stacked cards, cuisines as bowl tiles, then everything. */
export function LibraryCollections() {
  const data = useData();
  const recipes = useMemo(() => (data ? libraryRecipes() : []), [data]);
  const [open, setOpen] = useState<Open>(null);
  if (!data) return null;

  const mains = recipes.filter((r) => r.kind === "main");
  const sweets = recipes.filter((r) => r.kind === "sweet");
  const byBase = (id: BaseId) => recipes.filter((r) => baseOf(r) === id);
  const byCuisine = (c: CuisineFamily) => mains.filter((r) => cuisineOf(r) === c);

  if (open) {
    const list = open.kind === "base" ? byBase(open.base.id) : open.kind === "cuisine" ? byCuisine(open.cuisine) : sweets;
    const title = open.kind === "base" ? open.base.name : open.kind === "cuisine" ? CUISINE_LABEL[open.cuisine] : "Breakfast & sweets";
    return (
      <div className={styles.wrap}>
        <button type="button" className={styles.back} onClick={() => setOpen(null)}>
          <Icon name="back" size={18} /> Library
        </button>
        <header className={styles.openHead} style={open.kind === "base" ? { background: BASE_TINT[open.base.id] } : undefined}>
          <Fan recipes={list} size={84} />
          <h2 className="t-h1">{title}</h2>
          <p className="t-label t-muted">{count(list.length)}</p>
          {open.kind === "base" && (
            <>
              <p className="t-small">{open.base.about}</p>
              <p className={styles.once}>
                <strong>Make it once:</strong> {open.base.once}
              </p>
            </>
          )}
        </header>
        <div className={cardStyles.grid}>
          {list.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <section className={styles.shelf}>
        <div className={styles.shelfHead}>
          <h2 className="t-h3">Cook by flavour base</h2>
          <p className="t-small t-muted">Dishes that start the same way. Make the base once, cook several.</p>
        </div>
        <div className={styles.rail}>
          {basesIn(recipes).map((b) => {
            const list = byBase(b.id);
            return (
              <button key={b.id} type="button" className={styles.deck} onClick={() => setOpen({ kind: "base", base: b })}>
                <span className={styles.deckBack} aria-hidden />
                <span className={styles.deckMid} aria-hidden />
                <span className={styles.deckFront} style={{ background: BASE_TINT[b.id] }}>
                  <Fan recipes={list} size={64} />
                  <span className={styles.deckTitle}>{b.name}</span>
                  <span className="t-label t-muted">{count(list.length)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.shelf}>
        <h2 className="t-h3">By cuisine</h2>
        <div className={styles.tiles}>
          {cuisinesIn(recipes).map((c) => {
            const list = byCuisine(c);
            return (
              <button key={c} type="button" className={styles.tile} onClick={() => setOpen({ kind: "cuisine", cuisine: c })}>
                <BowlIllustration recipe={covers(list)[0]} size={96} look="inked" decorative />
                <span className={styles.pill}>
                  {CUISINE_LABEL[c]} <span className="t-muted">{list.length}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {sweets.length > 0 && (
        <button type="button" className={styles.banner} onClick={() => setOpen({ kind: "sweet" })}>
          <Fan recipes={sweets} size={56} />
          <span>
            <span className={styles.deckTitle}>Breakfast & sweets</span>
            <span className="t-label t-muted"> {count(sweets.length)}</span>
          </span>
          <Icon name="chevron" size={20} />
        </button>
      )}

      <section className={styles.shelf}>
        <h2 className="t-h3">Every recipe</h2>
        <div className={cardStyles.grid}>
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      </section>
    </div>
  );
}

/** Three bowls fanned out, the middle one in front: a collection at a glance. */
function Fan({ recipes, size }: { recipes: Recipe[]; size: number }) {
  const three = covers(recipes).slice(0, 3);
  const order = three.length === 3 ? [three[1], three[0], three[2]] : three;
  return (
    <span className={styles.fan} aria-hidden style={{ height: size }}>
      {order.map((r, i) => {
        const middle = three.length === 3 ? i === 1 : i === 0;
        const s = middle ? size : Math.round(size * 0.78);
        return (
          <span key={r.id} className={styles.fanItem} style={{ zIndex: middle ? 2 : 1, marginLeft: i ? -s * 0.3 : 0 }}>
            <BowlIllustration recipe={r} size={s} look="inked" decorative />
          </span>
        );
      })}
    </span>
  );
}
