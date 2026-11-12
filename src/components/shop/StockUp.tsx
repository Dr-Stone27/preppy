"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Layout";
import { allNeeded } from "@/domain/shop/list";
import { groupOf, SHOP_ORDER, stockOf, type Stock } from "@/domain/shop/pantry";
import { setStock } from "@/state/store";
import styles from "./Shop.module.css";

/** Shelf items your saved recipes use that you don't have yet. Buy once; ticking marks them as in stock. */
export function StockUp({ statuses, bases }: { statuses: Record<string, Stock>; bases: string[] }) {
  const shelf = allNeeded(bases).filter((x) => x.item && !x.item.fresh);
  const todo = shelf.filter((x) => stockOf(statuses, x.key) !== "have");
  // Most-used first, and only the top of the list until asked: 80-odd items for dishes you haven't chosen is a wall.
  const [everything, setEverything] = useState(false);
  const TOP = 20;
  const ranked = [...todo].sort((a, b) => b.from.size - a.from.size || a.name.localeCompare(b.name));
  const visible = everything ? ranked : ranked.slice(0, TOP);
  const done = shelf.length - todo.length;
  const pct = shelf.length ? Math.round((done / shelf.length) * 100) : 0;

  return (
    <>
      <section className={styles.summary}>
        <span className="t-eyebrow">First stock-up</span>
        <p className={styles.big}>
          {done}
          <small> of {shelf.length}</small>
        </p>
        <div className={styles.bar} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Stock-up progress">
          <i style={{ width: `${pct}%` }} />
        </div>
        <p className="t-small t-muted">The dry goods, spices and sauces Preppy’s dishes use most. You don’t need them all: start at the top, and tick each one you buy or already have. Ticked things stay off your lists.</p>
      </section>

      {!todo.length ? (
        <EmptyState title="All stocked" body="Everything your recipes need from the shelf is at home." />
      ) : (
        SHOP_ORDER.map((g) => {
          const list = visible.filter((x) => groupOf(x.item!.group) === g).sort((a, b) => b.from.size - a.from.size || a.name.localeCompare(b.name));
          if (!list.length) return null;
          return (
            <section key={g} className={styles.group}>
              <div className={styles.groupHead}>
                <h2 className="t-h3">{g}</h2>
                <span className="t-small t-muted">{list.length}</span>
              </div>
              <ul className={styles.lines}>
                {list.map((x) => (
                  <li key={x.key}>
                    <button type="button" className={styles.line} onClick={() => setStock(x.key, "have")}>
                      <span className={styles.box} aria-hidden />
                      <span className={styles.lineText}>
                        <span className={styles.lineName}>{x.item!.name}</span>
                        <span className={`t-label t-muted ${styles.from}`}>
                          {x.from.size} {x.from.size > 1 ? "recipes" : "recipe"} · {[...x.from].join(", ")}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
      {!everything && todo.length > TOP && (
        <Button variant="secondary" block onClick={() => setEverything(true)}>
          Show all {todo.length}
        </Button>
      )}
    </>
  );
}
