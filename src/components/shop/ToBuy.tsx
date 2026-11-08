"use client";

import { BowlCollage } from "@/components/bowl/BowlCollage";
import { Icon } from "@/components/ui/Icon";
import { dayName, weekStartFromKey } from "@/domain/plan/dates";
import type { Round, Week } from "@/domain/plan/types";
import { recipesFor } from "@/domain/plan/week";
import { pantryItems, stockOf, WHERE, WHERE_ORDER, type Stock } from "@/domain/shop/pantry";
import { amountText, shopLines, tickKey, type ShopLine } from "@/domain/shop/list";
import { setBought, setStock } from "@/state/store";
import styles from "./Shop.module.css";

type Props = { weekKey: string; week: Week; round: Round; statuses: Record<string, Stock> };

export function ToBuy({ weekKey, week, round: R, statuses }: Props) {
  const { buy, stocked } = shopLines(R, week, statuses);
  const got = buy.filter((l) => l.done).length;
  const onList = new Set([...buy, ...stocked].map((l) => l.key));
  const low = pantryItems().filter((p) => stockOf(statuses, p.id) === "low" && !onList.has(p.id));
  const pct = buy.length ? Math.round((got / buy.length) * 100) : 0;

  return (
    <>
      <section className={styles.summary}>
        <div className={styles.summaryRow}>
          <div>
            <span className="t-eyebrow">Shop before {dayName(weekStartFromKey(weekKey), R.cook, true)}</span>
            <p className={styles.big}>
              {got}
              <small> of {buy.length}</small>
            </p>
          </div>
          <BowlCollage recipes={recipesFor(R.mains)} size={44} />
        </div>
        <div className={styles.bar} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Shopping progress">
          <i style={{ width: `${pct}%` }} />
        </div>
      </section>

      {WHERE_ORDER.map((w) => {
        const lines = buy.filter((l) => l.where === w).sort((a, b) => Number(a.done) - Number(b.done) || a.name.localeCompare(b.name));
        if (!lines.length) return null;
        return (
          <section key={w} className={styles.group}>
            <div className={styles.groupHead}>
              <h2 className="t-h3">{WHERE[w]}</h2>
              <span className="t-small t-muted">
                {lines.filter((l) => l.done).length} of {lines.length}
              </span>
            </div>
            <ul className={styles.lines}>
              {lines.map((l) => (
                <Line key={l.key} line={l} weekKey={weekKey} round={R} />
              ))}
            </ul>
          </section>
        );
      })}

      {low.length > 0 && (
        <section className={styles.group}>
          <div className={styles.groupHead}>
            <h2 className="t-h3">Running low at home</h2>
          </div>
          <ul className={styles.lines}>
            {low.map((p) => (
              <li key={p.id}>
                <button type="button" className={styles.line} onClick={() => setStock(p.id, "have")}>
                  <span className={styles.box} aria-hidden />
                  <span className={styles.lineText}>
                    <span className={styles.lineName}>{p.name}</span>
                    <span className="t-label t-muted">{WHERE[p.where]}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {stocked.length > 0 && (
        <details className={styles.group}>
          <summary className={styles.groupHead}>
            <h2 className="t-h3">Already at home</h2>
            <span className="t-small t-muted">{stocked.length}</span>
          </summary>
          <ul className={styles.plain}>
            {stocked.map((l) => (
              <li key={l.key}>
                <span className={styles.lineName}>{l.item?.name ?? l.name}</span> <span className="t-small t-muted">{amountText(l)}</span>
              </li>
            ))}
          </ul>
          <p className="t-label t-muted">Mark something low or out under At home and it comes back onto the list.</p>
        </details>
      )}
    </>
  );
}

function Line({ line: l, weekKey, round: R }: { line: ShopLine; weekKey: string; round: Round }) {
  const tick = tickKey(R, l.key);
  const from = [...l.from].join(", ");
  return (
    <li data-done={l.done || undefined}>
      <button
        type="button"
        className={styles.line}
        aria-pressed={l.done}
        onClick={() => setBought(weekKey, tick, l.item && !l.item.fresh ? l.key : null, !l.done)}
      >
        <span className={styles.box} aria-hidden>
          {l.done && <Icon name="check" size={16} strokeWidth={2.4} />}
        </span>
        <span className={styles.lineText}>
          <span>
            <span className={styles.lineName}>{l.item?.name ?? l.name}</span> <span className="t-small t-muted">{amountText(l)}</span>
          </span>
          <span className={`t-label t-muted ${styles.from}`}>{from}</span>
        </span>
      </button>
    </li>
  );
}
