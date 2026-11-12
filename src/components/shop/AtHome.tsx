"use client";

import { GROUPS, NEXT_STOCK, pantryItems, STOCK_LABEL, stockOf, type Stock } from "@/domain/shop/pantry";
import { setStock } from "@/state/store";
import styles from "./Shop.module.css";

/** Every pantry item with its stock level. Tap the level to cycle Have → Low → Out. */
export function AtHome({ statuses }: { statuses: Record<string, Stock> }) {
  // Fresh food is always on the list because it doesn’t keep, so only things that keep get a level here.
  const items = pantryItems().filter((p) => !p.fresh);
  const counts: Record<Stock, number> = { have: 0, low: 0, out: 0 };
  for (const p of items) counts[stockOf(statuses, p.id)]++;

  return (
    <>
      <dl className={styles.counts}>
        {(["have", "low", "out"] as Stock[]).map((s) => (
          <div key={s}>
            <dd>{counts[s]}</dd>
            <dt>{STOCK_LABEL[s].toLowerCase()}</dt>
          </div>
        ))}
      </dl>
      <p className="t-small t-muted">Tap a level to change it. Things marked Have stay off your lists. Fresh food isn’t here: it’s always on the list, because it doesn’t keep.</p>
      {GROUPS.map((g) => {
        const list = items.filter((p) => (p.group || "Other") === g).sort((a, b) => a.name.localeCompare(b.name));
        if (!list.length) return null;
        return (
          <section key={g} className={styles.group}>
            <h2 className="t-h3">{g}</h2>
            <ul className={styles.stockList}>
              {list.map((p) => {
                const s = stockOf(statuses, p.id);
                return (
                  <li key={p.id}>
                    <span className={styles.lineName}>{p.name}</span>
                    <button
                      type="button"
                      className={`${styles.pill} ${styles[s]}`}
                      onClick={() => setStock(p.id, NEXT_STOCK[s])}
                      aria-label={`${p.name}: ${STOCK_LABEL[s]}. Change to ${STOCK_LABEL[NEXT_STOCK[s]]}`}
                    >
                      {STOCK_LABEL[s]}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}
