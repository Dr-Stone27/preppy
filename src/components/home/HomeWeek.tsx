"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BowlCollage } from "@/components/bowl/BowlCollage";
import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { addDays, dateLabel, dayName, daysBetween, today0, weekKey } from "@/domain/plan/dates";
import { goesInFreezer } from "@/domain/plan/cook";
import { cellKey, dayMacros, missedCook, nextRound, recipesFor, roundDates, roundMains, roundRange, SLOTS, stepWeek, weekStartFor } from "@/domain/plan/week";
import { recipeById, recipeHref } from "@/domain/recipes/library";
import { shopLines } from "@/domain/shop/list";
import { cookToday, type Data, getWeek, useData } from "@/state/store";
import styles from "./HomeWeek.module.css";

/** The date of the first cook in the week starting on `start`. */
function defaultWeekFirstCook(data: Data, start: Date) {
  const w = getWeek(data, weekKey(start));
  return addDays(start, w.rounds[0]?.cook ?? 0);
}

export function HomeWeek() {
  const data = useData();
  const router = useRouter();
  if (!data) return <div className={styles.placeholder} aria-busy="true" />;

  const today = today0();
  const weekStart = weekStartFor(data.weeks, data.prefs, today);
  const week = getWeek(data, weekKey(weekStart));
  // The next cook still to do: this week's, or next week's once this week's are done or passed.
  const nextStart = stepWeek(data.weeks, data.prefs, weekStart, 1);
  const nextWeek = getWeek(data, weekKey(nextStart));
  const thisR = nextRound(week, weekStart, today);
  const nextR = thisR ? null : nextRound(nextWeek, nextStart, today);
  const R = thisR ?? nextR;
  const rStart = thisR ? weekStart : nextStart;
  const rWeek = thisR ? week : nextWeek;
  const rKey = weekKey(rStart);
  const dayIndex = daysBetween(weekStart, today);
  const m = dayMacros(dayIndex, week.cells);

  // Tomorrow's meals that went in the freezer (more than two days after their cook): thaw tonight.
  const tomorrow = addDays(today, 1);
  const tStart = weekStartFor(data.weeks, data.prefs, tomorrow);
  const tWeek = getWeek(data, weekKey(tStart));
  const tDay = daysBetween(tStart, tomorrow);
  const tR = tWeek.rounds.find((x) => x.days.includes(tDay));
  const thaw =
    tR && tR.confirmed && roundDates(tStart, tR).cook <= today && goesInFreezer(tR, tDay)
      ? SLOTS.filter((x) => x.kind === "main").flatMap((x) => {
          const r = recipeById(tWeek.cells[cellKey(tDay, x.id)]?.r ?? "");
          return r ? [{ slot: x.label, title: r.title }] : [];
        })
      : [];

  const missed = thisR ? null : missedCook(week, weekStart, today);
  const startToday = () => {
    const id = cookToday(weekKey(weekStart), dayIndex);
    if (id) router.push(`/plan?build=${id}`);
  };

  let next: ReactNode;
  if (R) {
    const cook = roundDates(rStart, R).cook;
    const n = daysBetween(today, cook);
    const when = n === 0 ? "Today" : n === 1 ? "Tomorrow" : `In ${n} days`;
    const { buy } = shopLines(R, rWeek, data.pantry);
    const shop = { got: buy.filter((l) => l.done).length, total: buy.length };
    next = (
      <section className={styles.next}>
        <div className={styles.nextHead}>
          <div>
            <span className="t-eyebrow">Next cook</span>
            <h2 className="t-h2">
              {dayName(rStart, R.cook, true)} {dateLabel(cook)}
            </h2>
            <p className="t-small t-muted">
              {when} · for {roundRange(rStart, R)}
            </p>
          </div>
          {R.confirmed && <BowlCollage recipes={recipesFor(roundMains(R, rWeek.cells))} size={48} />}
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
                <ButtonLink href={`/plan/cook?week=${rKey}&round=${R.id}`} block>
                  Start cooking
                </ButtonLink>
              ) : (
                <ButtonLink href={`/shop?week=${rKey}&round=${R.id}`} block>
                  Go shopping
                </ButtonLink>
              )}
              <ButtonLink href={thisR ? "/plan" : "/plan?week=next"} variant="secondary" block>
                See the plan
              </ButtonLink>
            </div>
          </>
        ) : (
          <>
            <p className="t-small">Nothing picked for {dayName(rStart, R.cook, true)}’s cook yet.</p>
            <ButtonLink href={thisR ? `/plan?build=${R.id}` : `/plan?week=next&build=${R.id}`} block>
              Plan this cook
            </ButtonLink>
          </>
        )}
      </section>
    );
  } else {
    const afterStart = stepWeek(data.weeks, data.prefs, nextStart, 1);
    const nextCook = defaultWeekFirstCook(data, afterStart);
    next = (
      <section className={styles.next}>
        <span className="t-eyebrow">Next cook</span>
        <h2 className="t-h2">
          {dayName(nextCook, 0, true)} {dateLabel(nextCook)}
        </h2>
        <p className="t-small t-muted">Every cook until then is done.</p>
        <ButtonLink href="/plan" block>
          See the plan
        </ButtonLink>
      </section>
    );
  }

  return (
    <>
      {missed && (
        <section className={styles.next}>
          <span className="t-eyebrow">Starting today</span>
          <h2 className="t-h3">Cook today for the rest of this week</h2>
          <p className="t-small t-muted">
            {dayName(weekStart, missed.cook, true)}’s cook has passed. Plan a cook for today to cover {dayName(weekStart, dayIndex, true)}
            {missed.days.at(-1)! > dayIndex ? ` to ${dayName(weekStart, missed.days.at(-1)!, true)}` : ""}.
          </p>
          <Button block onClick={startToday}>
            Plan a cook for today
          </Button>
        </section>
      )}
      {next}
      {thaw.length > 0 && (
        <section className={styles.tonight} aria-label="Tonight">
          <span className="t-eyebrow">Tonight</span>
          <h2 className="t-h3">Take tomorrow’s meals out of the freezer</h2>
          <p className="t-small">{thaw.map((x) => `${x.slot}: ${x.title}`).join(" · ")}</p>
          <p className="t-label t-muted">Thaw them overnight in the fridge.</p>
        </section>
      )}
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
