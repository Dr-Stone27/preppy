"use client";

import { BowlCollage } from "@/components/bowl/BowlCollage";
import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Chip";
import { addDays, dayName, weekKey } from "@/domain/plan/dates";
import type { Round, SlotId, Week } from "@/domain/plan/types";
import { cellKey, eggCount, recipesFor, roundAverage, roundLabel, roundRange, roundStatus, SLOTS } from "@/domain/plan/week";
import { recipeById } from "@/domain/recipes/library";
import styles from "./Plan.module.css";

type Props = {
  round: Round;
  week: Week;
  weekStart: Date;
  onPlan: () => void;
  onMeal: (day: number, slot: SlotId) => void;
};

export function RoundCard({ round: R, week, weekStart, onPlan, onMeal }: Props) {
  const status = roundStatus(R);
  const mains = recipesFor(R.mains);
  const avg = roundAverage(R, week.cells);
  const eggs = eggCount(R, week.cells);
  const empty = !R.confirmed && !R.mains.length;

  return (
    <section className={styles.round} aria-label={roundLabel(R, weekStart)}>
      <div className={styles.roundHead}>
        <div>
          <span className="t-eyebrow">{roundLabel(R, weekStart)}</span>
          <h2 className="t-h2">{roundRange(weekStart, R)}</h2>
        </div>
        <Tag tone={R.cooked ? "success" : R.confirmed ? "accent" : "neutral"}>{status}</Tag>
      </div>

      {empty ? (
        <div className={styles.roundEmpty}>
          <p className="t-small t-muted">
            Pick what to cook on {dayName(weekStart, R.cook, true)} for these {R.days.length} days.
          </p>
          <Button onClick={onPlan}>Plan this round</Button>
        </div>
      ) : (
        <>
          <div className={styles.roundDishes}>
            <BowlCollage recipes={mains} size={52} />
            <ul className="t-small">
              {mains.map((r) => (
                <li key={r.id}>{r.title}</li>
              ))}
            </ul>
          </div>

          {(avg || eggs > 0) && (
            <div className={styles.chips}>
              {avg && (
                <Tag tone="warning">
                  About {avg.kcal.toLocaleString()} kcal · {avg.protein} g protein a day{avg.partial ? " +" : ""}
                </Tag>
              )}
              {eggs > 0 && <Tag>{eggs} eggs</Tag>}
            </div>
          )}

          <div className={styles.table} role="grid" aria-label={`${roundLabel(R, weekStart)} meals`}>
            <div className={styles.tableHead} role="row">
              <span role="columnheader" />
              {SLOTS.map((s) => (
                <span key={s.id} role="columnheader">
                  {s.short}
                </span>
              ))}
            </div>
            {R.days.map((d) => (
              <div key={d} className={styles.tableRow} role="row">
                <span className={styles.dayLabel} role="rowheader">
                  {dayName(weekStart, d)}
                  <small>{addDays(weekStart, d).getDate()}</small>
                </span>
                {SLOTS.map((s) => {
                  const c = week.cells[cellKey(d, s.id)];
                  const r = c && recipeById(c.r);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="gridcell"
                      className={styles.cell}
                      data-empty={!r || undefined}
                      onClick={() => onMeal(d, s.id)}
                      aria-label={`${dayName(weekStart, d, true)} ${s.label.toLowerCase()}: ${r ? r.title : "nothing planned"}`}
                    >
                      {r ? <BowlIllustration recipe={r} size={34} decorative /> : <span className={styles.cellEmpty} />}
                      <span className={styles.cellName}>{r ? r.title : ""}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className={styles.roundActions}>
            <Button variant="secondary" size="sm" onClick={onPlan}>
              Edit round
            </Button>
            {R.confirmed && (
              <ButtonLink href={`/plan/cook?week=${weekKey(weekStart)}&round=${R.id}`} size="sm" variant={R.cooked ? "secondary" : "primary"}>
                {R.cooked ? "Cooked · open again" : "Cook day"}
              </ButtonLink>
            )}
          </div>
        </>
      )}
    </section>
  );
}
