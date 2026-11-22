"use client";

import Link from "next/link";
import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { Icon } from "@/components/ui/Icon";
import { cuisineOf } from "@/domain/bowl/fromRecipe";
import type { CuisineFamily } from "@/domain/bowl/types";
import { baseById, baseOf, basesIn, BASES, type BaseId } from "@/domain/recipes/bases";
import { recipeHref } from "@/domain/recipes/library";
import { CUISINE_LABEL, cuisinesIn } from "@/domain/recipes/search";
import type { Recipe } from "@/domain/recipes/types";
import styles from "./LibraryCollections.module.css";

/** A collection, as it appears in the address: "base:pepper", "cuisine:nigerian", "sweet", "you" or "shared". */
export type CollectionKey = string;

const CUISINES = new Set(Object.keys(CUISINE_LABEL));

/** The recipes in a collection, its name, and its base when it is one. Null when the key isn't a collection. */
export function collection(key: CollectionKey, recipes: Recipe[]) {
  const [kind, id] = key.split(":");
  if (kind === "base" && BASES.some((b) => b.id === id)) {
    const base = baseById(id as BaseId);
    return { title: base.name, base, list: recipes.filter((r) => r.origin !== "shared" && baseOf(r) === base.id) };
  }
  if (kind === "cuisine" && CUISINES.has(id)) {
    return { title: CUISINE_LABEL[id as CuisineFamily], list: recipes.filter((r) => r.kind === "main" && r.origin !== "shared" && cuisineOf(r) === id) };
  }
  if (kind === "sweet") return { title: "Breakfast & sweets", list: recipes.filter((r) => r.kind === "sweet" && r.origin !== "shared") };
  if (kind === "all") return { title: "All recipes", list: recipes.filter((r) => r.origin !== "shared") };
  if (kind === "you") return { title: "Saved by you", list: recipes.filter((r) => r.origin === "you") };
  if (kind === "shared") return { title: "From other cooks", list: recipes.filter((r) => r.origin === "shared") };
  return null;
}

/** The dishes that best stand for a collection go first: mains, and rice dishes first among those. */
const covers = (list: Recipe[]) =>
  [...list].sort((a, b) => Number(b.kind === "main") - Number(a.kind === "main") || Number(/jollof|rice/i.test(b.title)) - Number(/jollof|rice/i.test(a.title)));

const count = (n: number) => (n === 1 ? "1 dish" : `${n} dishes`);

/** The library's front page: flavour bases as stacked cards, cuisines as bowl tiles, then sweets and your own. */
export function CollectionsHome({
  recipes,
  onOpen,
  shared,
}: {
  recipes: Recipe[];
  onOpen: (key: CollectionKey) => void;
  /** Other cooks' newest recipes: null when accounts aren't on, so the row doesn't show. */
  shared: { recipe: Recipe; by: string | null }[] | "loading" | "error" | null;
}) {
  const own = recipes.filter((r) => r.origin !== "shared");
  const mains = own.filter((r) => r.kind === "main");
  const sweets = own.filter((r) => r.kind === "sweet");
  const yours = own.filter((r) => r.origin === "you");

  return (
    <div className={styles.wrap}>
      {/* The screen's one loud thing: flavour bases, the answer to "what should I cook?" for a batch cook. */}
      <section className={`${styles.shelf} ${styles.heroShelf}`}>
        <div className={styles.shelfHead}>
          <h2 className="t-h2">Cook by flavour base</h2>
          <p className="t-small t-muted">Dishes that start the same way. Make the base once, cook several.</p>
        </div>
        <div className={styles.rail}>
          {basesIn(own).map((b) => {
            const list = own.filter((r) => baseOf(r) === b.id);
            return (
              <button key={b.id} type="button" className={styles.deck} onClick={() => onOpen(`base:${b.id}`)}>
                <span className={styles.deckBack} aria-hidden />
                <span className={styles.deckMid} aria-hidden />
                <span className={styles.deckFront}>
                  <Fan recipes={list} size={72} />
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
          {cuisinesIn(own).map((c) => {
            const list = mains.filter((r) => cuisineOf(r) === c);
            return (
              <button key={c} type="button" className={styles.tile} onClick={() => onOpen(`cuisine:${c}`)}>
                <BowlIllustration recipe={covers(list)[0]} size={88} decorative />
                <span className={styles.pill}>
                  {CUISINE_LABEL[c]} <span className="t-muted">{list.length}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {shared !== null && (
        <section className={styles.shelf}>
          <div className={styles.shelfTop}>
            <h2 className="t-h3">New from other cooks</h2>
            {Array.isArray(shared) && shared.length > 0 && (
              <button type="button" className={styles.seeAll} onClick={() => onOpen("shared")}>
                See all
              </button>
            )}
          </div>
          {shared === "loading" ? (
            <p className="t-small t-muted" aria-busy="true">
              Loading what other cooks shared…
            </p>
          ) : shared === "error" ? (
            <p className="t-small t-muted">Couldn’t load recipes from other cooks just now.</p>
          ) : shared.length === 0 ? (
            <p className="t-small t-muted">Nothing shared yet. Share one of your saved recipes from its page and it shows up here for everyone.</p>
          ) : (
            <div className={styles.rail}>
              {shared.slice(0, 8).map(({ recipe: r, by }) => (
                <Link key={r.id} href={recipeHref(r)} className={styles.mini}>
                  <BowlIllustration recipe={r} size={76} decorative />
                  <span className={styles.miniTitle}>{r.title}</span>
                  <span className="t-label t-muted">{by ? `by ${by}` : "by a Preppy cook"}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      <section className={styles.shelf}>
        <h2 className="t-h3">More to browse</h2>
        <Banner title="All recipes" note={count(own.length)} recipes={mains} onClick={() => onOpen("all")} />
        {sweets.length > 0 && <Banner title="Breakfast & sweets" note={count(sweets.length)} recipes={sweets} onClick={() => onOpen("sweet")} />}
        {yours.length > 0 && <Banner title="Saved by you" note={count(yours.length)} recipes={yours} onClick={() => onOpen("you")} />}
      </section>
    </div>
  );
}

/** A quiet card: food carries the colour, the card doesn't. */
function Banner({ title, note, recipes, onClick }: { title: string; note: string; recipes: Recipe[]; onClick: () => void }) {
  return (
    <button type="button" className={styles.banner} onClick={onClick}>
      <Fan recipes={recipes} size={52} />
      <span className={styles.bannerText}>
        <span className={styles.deckTitle}>{title}</span>
        <span className="t-label t-muted">{note}</span>
      </span>
      <Icon name="chevron" size={20} />
    </button>
  );
}

/**
 * The header of an opened collection, on the hero card: the fanned bowls, its name and count, and for a flavour base,
 * how to make it once.
 */
export function CollectionHead({ collectionKey, recipes }: { collectionKey: CollectionKey; recipes: Recipe[] }) {
  const c = collection(collectionKey, recipes);
  if (!c) return null;
  return (
    <header className={styles.openHead}>
      {c.list.length > 0 && (
        <div className={styles.openBowls}>
          <Fan recipes={c.list} size={heroFanSize(c.list.length)} />
        </div>
      )}
      <h2 className="t-h1">{c.title}</h2>
      {c.list.length > 0 && <p className="t-label t-muted">{count(c.list.length)}</p>}
      {c.base && (
        <>
          <p className="t-small">{c.base.about}</p>
          <p className={styles.once}>
            <strong>Make it once:</strong> {c.base.once}
          </p>
        </>
      )}
    </header>
  );
}

/**
 * Fan size on a hero card: one or two bowls at 160px, three shrunk to fit a phone-width card (side bowls are 78% and
 * overlap by 30%), never below 88px.
 */
function heroFanSize(n: number, width = 276) {
  const k = Math.min(n, 3);
  const span = 1 + (k - 1) * 0.78 * 0.7;
  return Math.max(88, Math.min(160, Math.floor(width / span)));
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
            <BowlIllustration recipe={r} size={s} decorative />
          </span>
        );
      })}
    </span>
  );
}
