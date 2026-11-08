"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BowlCollage } from "@/components/bowl/BowlCollage";
import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { ButtonLink } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { addDays, DAY_FULL, dateLabel, daysBetween, sundayOf, today0, weekKey } from "@/domain/plan/dates";
import { cellKey, dayMacros, nextRound, recipesFor, roundDates, roundRange, SLOTS } from "@/domain/plan/week";
import { recipeById } from "@/domain/recipes/library";
import { shopLines } from "@/domain/shop/list";
import { getWeek, useData } from "@/state/store";
import styles from "./HomeWeek.module.css";

export function HomeWeek() {
  const data = useData();
  if (!data) return <div className={styles.placeholder} aria-busy="true" />;

  const today = today0();
  const weekStart = sundayOf(today);
  const week = getWeek(data, weekKey(weekStart));
  const R = nextRound(week, weekStart, today);
  const dayIndex = today.getDay();
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
              {DAY_FULL[R.cook]} {dateLabel(cook)}
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
              <ButtonLink href={`/shop?round=${R.id}`} block>
                Go shopping
              </ButtonLink>
              <ButtonLink href="/plan" variant="secondary" block>
                See the plan
              </ButtonLink>
            </div>
          </>
        ) : (
          <>
            <p className="t-small">Nothing picked for {DAY_FULL[R.cook]}’s cook yet.</p>
            <ButtonLink href={`/plan?build=${R.id}`} block>
              Plan this round
            </ButtonLink>
          </>
        )}
      </section>
    );
  } else {
    next = (
      <section className={styles.next}>
        <span className="t-eyebrow">Next cook</span>
        <h2 className="t-h2">Sunday {dateLabel(addDays(weekStart, 7))}</h2>
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
                <Link href={r ? `/library/${r.id}` : "/plan"} className={styles.meal}>
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
