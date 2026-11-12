"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { allNeeded } from "@/domain/shop/list";
import { groupOf, pantryItems, SHOP_ORDER, STOCK_LABEL, stockOf, type Stock } from "@/domain/shop/pantry";
import { setStock } from "@/state/store";
import { GroupTitle } from "./GroupTitle";
import styles from "./Shop.module.css";

const LEVELS: Stock[] = ["have", "low", "out"];
const LEVEL_ICON = { have: "jarFull", low: "jarLow", out: "jarEmpty" } as const;
const TOP = 20;

/**
 * What's in the kitchen: every dry good, spice and sauce, most used by the recipes first.
 * Have keeps it off shopping lists; Low and Out put it on. Fresh food isn't here because it's always bought.
 */
export function AtHome({ statuses, bases }: { statuses: Record<string, Stock>; bases: string[] }) {
  const [query, setQuery] = useState("");
  const [everything, setEverything] = useState(false);

  const uses = new Map(allNeeded(bases).map((x) => [x.key, x.from.size]));
  const items = pantryItems()
    .filter((p) => !p.fresh)
    .map((p) => ({ ...p, uses: uses.get(p.id) ?? 0 }))
    .sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name));
  const have = items.filter((p) => stockOf(statuses, p.id) !== "out").length;

  const q = query.trim().toLowerCase();
  const matching = q ? items.filter((p) => p.name.toLowerCase().includes(q)) : items;
  const shown = q || everything ? matching : matching.slice(0, TOP);

  return (
    <>
      <section className={styles.summary}>
        <span className="t-eyebrow">In your kitchen</span>
        <p className={styles.big}>
          {have}
          <small> of {items.length}</small>
        </p>
        <p className="t-small t-muted">
          Dry goods, spices and sauces, the ones recipes use most first. Mark what you have and it stays off your shopping lists. Fresh food isn’t here: it’s always on the list, because it doesn’t keep.
        </p>
      </section>

      <div className={styles.finderWrap}>
        <label className={styles.finder}>
          <Icon name="search" size={18} />
          <span className="visually-hidden">Find something in your kitchen</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find, like curry powder" type="search" autoComplete="off" enterKeyHint="search" />
        </label>
      </div>

      {!shown.length && <p className="t-small t-muted">Nothing called “{query.trim()}” here. Add it on the To buy list instead.</p>}

      {SHOP_ORDER.map((g) => {
        const list = shown.filter((p) => groupOf(p.group) === g);
        if (!list.length) return null;
        return (
          <section key={g} className={styles.group}>
            <GroupTitle group={g} />
            <ul className={styles.stockList}>
              {list.map((p) => {
                const s = stockOf(statuses, p.id);
                return (
                  <li key={p.id}>
                    <span className={styles.lineText}>
                      <span className={styles.lineName}>{p.name}</span>
                      {p.uses > 0 && <span className="t-label t-muted">In {p.uses === 1 ? "1 recipe" : `${p.uses} recipes`}</span>}
                    </span>
                    <span className={styles.levels} role="radiogroup" aria-label={`${p.name}: how much you have`}>
                      {LEVELS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          role="radio"
                          aria-checked={s === level}
                          className={s === level ? styles[level] : undefined}
                          onClick={() => setStock(p.id, level)}
                          aria-label={STOCK_LABEL[level]}
                          title={STOCK_LABEL[level]}
                        >
                          <Icon name={LEVEL_ICON[level]} size={20} />
                          {s === level && <span aria-hidden>{STOCK_LABEL[level]}</span>}
                        </button>
                      ))}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {!q && !everything && items.length > TOP && (
        <Button variant="secondary" block onClick={() => setEverything(true)}>
          Show all {items.length}
        </Button>
      )}
    </>
  );
}
