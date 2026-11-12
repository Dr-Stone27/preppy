"use client";

import { type ReactNode, useState } from "react";
import { BowlCollage } from "@/components/bowl/BowlCollage";
import { Icon } from "@/components/ui/Icon";
import { dayName, weekStartFromKey } from "@/domain/plan/dates";
import type { Extra, Round, Week } from "@/domain/plan/types";
import { recipesFor, slug } from "@/domain/plan/week";
import { groupOf, guessGroup, pantryItems, pantryMatch, SHOP_ORDER, stockOf, type Stock } from "@/domain/shop/pantry";
import { amountText, shopLines, tickKey, type ShopLine } from "@/domain/shop/list";
import { track } from "@/lib/analytics";
import { addExtra, removeExtra, setBought, setExtraDone, setStock } from "@/state/store";
import styles from "./Shop.module.css";

type Props = { weekKey: string; week: Week; round: Round; statuses: Record<string, Stock>; empty?: ReactNode };

/** What was typed, tidied for the list: trimmed, single spaces, first letter capital, not absurdly long. */
const tidy = (s: string) => {
  const t = s.trim().replace(/\s+/g, " ").slice(0, 60);
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const nameOf = (l: ShopLine) => l.item?.name ?? l.name;

type Row = { kind: "need"; line: ShopLine } | { kind: "extra"; extra: Extra };
const rowName = (r: Row) => (r.kind === "need" ? nameOf(r.line) : r.extra.name);
const rowDone = (r: Row) => (r.kind === "need" ? r.line.done : !!r.extra.done);

/** The round's shopping list, grouped by food type, with one box to find an item or add your own. */
export function ToBuy({ weekKey, week, round: R, statuses, empty }: Props) {
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");

  const { buy, stocked } = shopLines(R, week, statuses);
  const extras = R.extras ?? [];
  const onList = new Set([...buy, ...stocked].map((l) => l.key));
  const low = pantryItems().filter((p) => stockOf(statuses, p.id) === "low" && !onList.has(p.id));

  const total = buy.length + extras.length;
  const got = buy.filter((l) => l.done).length + extras.filter((e) => e.done).length;
  const pct = total ? Math.round((got / total) * 100) : 0;

  const q = query.trim().toLowerCase();
  const has = (name: string) => !q || name.toLowerCase().includes(q);
  const rows: Row[] = [
    ...buy.filter((l) => has(nameOf(l))).map((line): Row => ({ kind: "need", line })),
    ...extras.filter((e) => has(e.name)).map((extra): Row => ({ kind: "extra", extra })),
  ];
  const stockedShown = stocked.filter((l) => has(nameOf(l)));
  const lowShown = low.filter((p) => has(p.name));

  // Offer to add what was typed unless the list already has it.
  const typed = slug(query);
  const exists =
    [...buy, ...stocked].some((l) => l.key === typed || slug(nameOf(l)) === typed) || extras.some((e) => slug(e.name) === typed);
  const canAdd = q.length > 0 && !exists && extras.length < 100;
  // Enter adds only when nothing matches, so searching "chick" and pressing Enter doesn't add "Chick".
  const nothingMatches = !rows.length && !stockedShown.length;

  const add = () => {
    const match = pantryMatch(query.trim());
    const name = match?.name ?? tidy(query);
    const group = groupOf(match?.group ?? guessGroup(name));
    const id = `x${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    if (!addExtra(weekKey, R.id, { id, name, group })) return;
    track("list_item_added", { known: !!match });
    setQuery("");
    setNote(`Added ${name} under ${group}.`);
  };

  const nothingYet = !buy.length && !stocked.length && !extras.length;

  return (
    <>
      <section className={styles.summary}>
        <div className={styles.summaryRow}>
          <div>
            <span className="t-eyebrow">Shop before {dayName(weekStartFromKey(weekKey), R.cook, true)}</span>
            <p className={styles.big}>
              {got}
              <small> of {total}</small>
            </p>
          </div>
          <BowlCollage recipes={recipesFor(R.mains)} size={44} />
        </div>
        <div className={styles.bar} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Shopping progress">
          <i style={{ width: `${pct}%` }} />
        </div>
      </section>

      <div className={styles.finderWrap}>
        <form
          className={styles.finder}
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (canAdd && nothingMatches) add();
          }}
        >
          <Icon name="search" size={18} />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setNote("");
            }}
            placeholder="Find or add an item"
            aria-label="Find or add an item"
            enterKeyHint={canAdd && nothingMatches ? "done" : "search"}
            autoComplete="off"
            autoCorrect="off"
          />
          {query && (
            <button type="button" aria-label="Clear" onClick={() => setQuery("")}>
              <Icon name="close" size={16} strokeWidth={2.2} />
            </button>
          )}
        </form>
        {canAdd && (
          <button type="button" className={styles.addBtn} onClick={add}>
            <Icon name="plus" size={18} strokeWidth={2.2} />
            Add “{tidy(query)}” to your list
          </button>
        )}
      </div>
      <p className={`t-label t-muted ${styles.note}`} role="status">
        {note}
      </p>

      {nothingYet && !q && empty}

      {q && !rows.length && !stockedShown.length && !lowShown.length && !canAdd && <p className="t-small t-muted">Nothing on the list matches “{query.trim()}”.</p>}

      {SHOP_ORDER.map((g) => {
        const list = rows
          .filter((r) => (r.kind === "need" ? r.line.group : groupOf(r.extra.group)) === g)
          .sort((a, b) => Number(rowDone(a)) - Number(rowDone(b)) || rowName(a).localeCompare(rowName(b)));
        if (!list.length) return null;
        return (
          <section key={g} className={styles.group}>
            <div className={styles.groupHead}>
              <h2 className="t-h3">{g}</h2>
              <span className="t-small t-muted">
                {list.filter(rowDone).length} of {list.length}
              </span>
            </div>
            <ul className={styles.lines}>
              {list.map((r) =>
                r.kind === "need" ? (
                  <Line key={r.line.key} line={r.line} weekKey={weekKey} round={R} />
                ) : (
                  <ExtraLine key={r.extra.id} extra={r.extra} weekKey={weekKey} round={R} />
                ),
              )}
            </ul>
          </section>
        );
      })}

      {lowShown.length > 0 && (
        <section className={styles.group}>
          <div className={styles.groupHead}>
            <h2 className="t-h3">Running low at home</h2>
          </div>
          <ul className={styles.lines}>
            {lowShown.map((p) => (
              <li key={p.id}>
                <button type="button" className={styles.line} onClick={() => setStock(p.id, "have")}>
                  <span className={styles.box} aria-hidden />
                  <span className={styles.lineText}>
                    <span className={styles.lineName}>{p.name}</span>
                    <span className="t-label t-muted">{groupOf(p.group)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {stockedShown.length > 0 && (
        <details className={styles.group} open={q ? true : undefined}>
          <summary className={styles.groupHead}>
            <h2 className="t-h3">Already at home</h2>
            <span className="t-small t-muted">{stockedShown.length}</span>
          </summary>
          <ul className={styles.plain}>
            {stockedShown.map((l) => (
              <li key={l.key}>
                <span className={styles.lineName}>{nameOf(l)}</span> <span className="t-small t-muted">{amountText(l)}</span>
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
            <span className={styles.lineName}>{nameOf(l)}</span> <span className="t-small t-muted">{amountText(l)}</span>
          </span>
          <span className={`t-label t-muted ${styles.from}`}>{from}</span>
        </span>
      </button>
    </li>
  );
}

function ExtraLine({ extra: e, weekKey, round: R }: { extra: Extra; weekKey: string; round: Round }) {
  return (
    <li data-done={e.done || undefined} className={styles.extraRow}>
      <button type="button" className={styles.line} aria-pressed={!!e.done} onClick={() => setExtraDone(weekKey, R.id, e.id, !e.done)}>
        <span className={styles.box} aria-hidden>
          {e.done && <Icon name="check" size={16} strokeWidth={2.4} />}
        </span>
        <span className={styles.lineText}>
          <span className={styles.lineName}>{e.name}</span>
          <span className={`t-label t-muted ${styles.from}`}>Added by you</span>
        </span>
      </button>
      <button type="button" className={styles.removeBtn} aria-label={`Remove ${e.name}`} onClick={() => removeExtra(weekKey, R.id, e.id)}>
        <Icon name="close" size={16} strokeWidth={2.2} />
      </button>
    </li>
  );
}
