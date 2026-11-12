"use client";

import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { Icon } from "@/components/ui/Icon";
import { cuisineOf } from "@/domain/bowl/fromRecipe";
import type { CuisineFamily } from "@/domain/bowl/types";
import { baseById, baseOf, basesIn, BASES, type BaseId } from "@/domain/recipes/bases";
import { CUISINE_LABEL, cuisinesIn } from "@/domain/recipes/search";
import type { Recipe } from "@/domain/recipes/types";
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
  if (kind === "you") return { title: "Saved by you", list: recipes.filter((r) => r.origin === "you") };
  if (kind === "shared") return { title: "From other cooks", list: recipes.filter((r) => r.origin === "shared") };
  return null;
}

/** The dishes that best stand for a collection go first: mains, and rice dishes first among those. */
const covers = (list: Recipe[]) =>
  [...list].sort((a, b) => Number(b.kind === "main") - Number(a.kind === "main") || Number(/jollof|rice/i.test(b.title)) - Number(/jollof|rice/i.test(a.title)));

const count = (n: number) => (n === 1 ? "1 dish" : `${n} dishes`);

/** The library's front page: flavour bases as stacked cards, cuisines as bowl tiles, then sweets and your own. */
export function CollectionsHome({ recipes, onOpen, showShared }: { recipes: Recipe[]; onOpen: (key: CollectionKey) => void; showShared: boolean }) {
  const own = recipes.filter((r) => r.origin !== "shared");
  const mains = own.filter((r) => r.kind === "main");
  const sweets = own.filter((r) => r.kind === "sweet");
  const yours = own.filter((r) => r.origin === "you");

  return (
    <div className={styles.wrap}>
      <section className={styles.shelf}>
        <div className={styles.shelfHead}>
          <h2 className="t-h3">Cook by flavour base</h2>
          <p className="t-small t-muted">Dishes that start the same way. Make the base once, cook several.</p>
        </div>
        <div className={styles.rail}>
          {basesIn(own).map((b) => {
            const list = own.filter((r) => baseOf(r) === b.id);
            return (
              <button key={b.id} type="button" className={styles.deck} onClick={() => onOpen(`base:${b.id}`)}>
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

      <section className={styles.shelf}>
        <h2 className="t-h3">More to browse</h2>
        {sweets.length > 0 && <Banner title="Breakfast & sweets" note={count(sweets.length)} recipes={sweets} tint="var(--color-warning-soft)" onClick={() => onOpen("sweet")} />}
        {yours.length > 0 && <Banner title="Saved by you" note={count(yours.length)} recipes={yours} tint="var(--color-action-soft)" onClick={() => onOpen("you")} />}
        {showShared && <Banner title="From other cooks" note="Recipes other Preppy cooks chose to share" recipes={[]} tint="var(--color-success-soft)" icon="user" onClick={() => onOpen("shared")} />}
      </section>
    </div>
  );
}

function Banner({ title, note, recipes, tint, icon, onClick }: { title: string; note: string; recipes: Recipe[]; tint: string; icon?: "user"; onClick: () => void }) {
  return (
    <button type="button" className={styles.banner} style={{ background: tint }} onClick={onClick}>
      {recipes.length ? (
        <Fan recipes={recipes} size={52} />
      ) : (
        <span className={styles.bannerIcon}>
          <Icon name={icon ?? "library"} size={24} />
        </span>
      )}
      <span className={styles.bannerText}>
        <span className={styles.deckTitle}>{title}</span>
        <span className="t-label t-muted">{note}</span>
      </span>
      <Icon name="chevron" size={20} />
    </button>
  );
}

/** The header of an opened collection: the fanned bowls, its name and count, and for a flavour base, how to make it once. */
export function CollectionHead({ collectionKey, recipes }: { collectionKey: CollectionKey; recipes: Recipe[] }) {
  const c = collection(collectionKey, recipes);
  if (!c) return null;
  return (
    <header className={styles.openHead} style={c.base ? { background: BASE_TINT[c.base.id] } : undefined}>
      {c.list.length > 0 && <Fan recipes={c.list} size={80} />}
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
