"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { allNeeded } from "@/domain/shop/list";
import { groupOf, pantryItems, SHOP_ORDER, STOCK_LABEL, stockOf, type Stock } from "@/domain/shop/pantry";
import { setStock } from "@/state/store";
import { GroupTitle } from "./GroupTitle";
import { itemIcon } from "./itemIcon";
import styles from "./Shop.module.css";

const LEVELS: Stock[] = ["have", "low", "out"];
const LEVEL_ICON = { have: "jarFull", low: "jarLow", out: "jarEmpty" } as const;
const TOP = 24;

/**
 * What's in the kitchen: every dry good, spice and sauce as a tile, most used by the recipes first.
 * The tile's colour is how much you have. Tap it to choose Have, Low or Out; Low and Out put it on shopping lists.
 * Fresh food isn't here because it's always bought.
 */
export function AtHome({ statuses, bases }: { statuses: Record<string, Stock>; bases: string[] }) {
  const [query, setQuery] = useState("");
  const [everything, setEverything] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const uses = new Map(allNeeded(bases).map((x) => [x.key, x.from.size]));
  const items = pantryItems()
    .filter((p) => !p.fresh)
    .map((p) => ({ ...p, uses: uses.get(p.id) ?? 0 }))
    .sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name));
  const have = items.filter((p) => stockOf(statuses, p.id) !== "out").length;

  const q = query.trim().toLowerCase();
  const matching = q ? items.filter((p) => p.name.toLowerCase().includes(q)) : items;
  const shown = q || everything ? matching : matching.slice(0, TOP);
  const openItem = items.find((p) => p.id === open);

  return (
    <>
      <section className={styles.summary}>
        <span className="t-eyebrow">In your kitchen</span>
        <p className={styles.big}>
          {have}
          <small> of {items.length}</small>
        </p>
        <p className="t-small t-muted">
          Dry goods, spices and sauces, the ones recipes use most first. Tap one to say how much you have; anything low or out goes on your shopping list. Fresh food isn’t here: it’s always on the list, because it doesn’t keep.
        </p>
        <p className={styles.legend} aria-hidden>
          {LEVELS.map((l) => (
            <span key={l} className={styles[l]}>
              <Icon name={LEVEL_ICON[l]} size={16} /> {STOCK_LABEL[l]}
            </span>
          ))}
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
            <ul className={styles.tiles}>
              {list.map((p) => {
                const s = stockOf(statuses, p.id);
                return (
                  <li key={p.id}>
                    <button type="button" className={`${styles.tile} ${styles[s]}`} onClick={() => setOpen(p.id)} aria-haspopup="dialog" aria-label={`${p.name}: ${STOCK_LABEL[s]}`}>
                      <Icon name={itemIcon(p.name, p.group)} size={28} strokeWidth={1.6} />
                      <span className={styles.tileName}>{p.name}</span>
                      <span className={styles.tileState}>
                        <Icon name={LEVEL_ICON[s]} size={13} strokeWidth={2} /> {STOCK_LABEL[s]}
                      </span>
                    </button>
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

      {openItem && (
        <div className={styles.sheetBack} onClick={() => setOpen(null)}>
          <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={`${openItem.name}: how much you have`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHead}>
              <span className={styles.sheetIcon}>
                <Icon name={itemIcon(openItem.name, openItem.group)} size={26} strokeWidth={1.6} />
              </span>
              <span>
                <span className="t-h3">{openItem.name}</span>
                {openItem.uses > 0 && <span className="t-label t-muted"> · in {openItem.uses === 1 ? "1 recipe" : `${openItem.uses} recipes`}</span>}
              </span>
            </div>
            <div className={styles.sheetLevels} role="radiogroup" aria-label="How much you have">
              {LEVELS.map((l) => {
                const on = stockOf(statuses, openItem.id) === l;
                return (
                  <button
                    key={l}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    autoFocus={on}
                    className={`${styles.sheetLevel} ${on ? styles[l] : ""}`}
                    onClick={() => {
                      setStock(openItem.id, l);
                      setOpen(null);
                    }}
                  >
                    <Icon name={LEVEL_ICON[l]} size={32} />
                    {STOCK_LABEL[l]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
