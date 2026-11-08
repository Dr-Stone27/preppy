"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BowlCollage } from "@/components/bowl/BowlCollage";
import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { ButtonLink } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { addDays, dateLabel, dayName, daysBetween, today0, weekKey } from "@/domain/plan/dates";
import { cellKey, dayMacros, nextRound, recipesFor, roundDates, roundRange, SLOTS, stepWeek, weekStartFor } from "@/domain/plan/week";
import { recipeById, recipeHref } from "@/domain/recipes/library";
import { shopLines } from "@/domain/shop/list";
import { type Data, getWeek, useData } from "@/state/store";
import styles from "./HomeWeek.module.css";

/** The date of the first cook in the week starting on `start`. */
function defaultWeekFirstCook(data: Data, start: Date) {
  const w = getWeek(data, weekKey(start));
  return addDays(start, w.rounds[0]?.cook ?? 0);
}

export function HomeWeek() {
  const data = useData();
  if (!data) return <div className={styles.placeholder} aria-busy="true" />;

  const today = today0();
  const weekStart = weekStartFor(data.weeks, data.prefs, today);
  const week = getWeek(data, weekKey(weekStart));
  const R = nextRound(week, weekStart, today);
  const dayIndex = daysBetween(weekStart, today);
  const m = dayMacros(dayIndex, week.cells);

  let next: ReactNode;
  if (R) {
    const cook = roundDates(weekStart, R).cook;
    const n = daysBetween(today, cook);
    const when = n === 0 ? "Today" : n === 1 ? "Tomorrow" : `In ${n} days`;
    const { buy } = shopLines(R, week, data.pantry);
    const shop = { got: buy.filter((l) => l.done).length, total: buy.length };
    next = (
      <section className={styles.next}>
        <div className={styles.nextHead}>
          <div>
            <span className="t-eyebrow">Next cook</span>
            <h2 className="t-h2">
              {dayName(weekStart, R.cook, true)} {dateLabel(cook)}
            </h2>
            <p className="t-small t-muted">
              {when} · for {roundRange(weekStart, R)}
            </p>
          </div>
          {R.confirmed && <BowlCollage recipes={recipesFor(R.mains)} size={48} />}
        </div>
        {R.confirmed ? (
          <>
            <div className={styles.progress}>
              <div className={styles.progressRow}>
                <span>Shopping</span>
                <span>
                  {shop.got} of {shop.total}
                </span>
              </div>
              <div className={styles.bar}>
                <i style={{ width: `${shop.total ? Math.round((shop.got / shop.total) * 100) : 0}%` }} />
              </div>
            </div>
            <div className={styles.actions}>
              {n === 0 ? (
                <ButtonLink href={`/plan/cook?round=${R.id}`} block>
                  Start cooking
                </ButtonLink>
              ) : (
                <ButtonLink href={`/shop?round=${R.id}`} block>
                  Go shopping
                </ButtonLink>
              )}
              <ButtonLink href="/plan" variant="secondary" block>
                See the plan
              </ButtonLink>
            </div>
          </>
        ) : (
          <>
            <p className="t-small">Nothing picked for {dayName(weekStart, R.cook, true)}’s cook yet.</p>
            <ButtonLink href={`/plan?build=${R.id}`} block>
              Plan this round
            </ButtonLink>
          </>
        )}
      </section>
    );
  } else {
    const nextStart = stepWeek(data.weeks, data.prefs, weekStart, 1);
    const nextCook = defaultWeekFirstCook(data, nextStart);
    next = (
      <section className={styles.next}>
        <span className="t-eyebrow">Next cook</span>
        <h2 className="t-h2">
          {dayName(nextCook, 0, true)} {dateLabel(nextCook)}
        </h2>
        <p className="t-small t-muted">This week’s cooking is done.</p>
        <ButtonLink href="/plan" block>
          Plan next week
        </ButtonLink>
      </section>
    );
  }

  return (
    <>
      {next}
      <section className={styles.today}>
        <div className={styles.todayHead}>
          <h2 className="t-h3">Today</h2>
          {m.known > 0 && (
            <Tag tone="warning">
              {m.kcal.toLocaleString()} kcal · {m.protein} g protein{m.unknown ? " +" : ""}
            </Tag>
          )}
        </div>
        <ul className={styles.meals}>
          {SLOTS.map((s) => {
            const c = week.cells[cellKey(dayIndex, s.id)];
            const r = c && recipeById(c.r);
            return (
              <li key={s.id}>
                <Link href={r ? recipeHref(r) : "/plan"} className={styles.meal}>
                  {r ? <BowlIllustration recipe={r} size={44} decorative /> : <span className={styles.emptyBowl} />}
                  <span className={styles.mealText}>
                    <span className="t-label t-muted">{s.label}</span>
                    <span className={r ? styles.mealTitle : `${styles.mealTitle} t-muted`}>{r ? r.title : "Nothing planned"}</span>
                    {c?.base && <span className="t-label t-muted">with {c.base.toLowerCase()}</span>}
                  </span>
                  <Icon name="chevron" size={18} />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
