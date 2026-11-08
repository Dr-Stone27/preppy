"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { IconButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { addDays, dateLabel, DAYS, sundayOf, today0, weekKey, ymd } from "@/domain/plan/dates";
import type { RoundId, SlotId } from "@/domain/plan/types";
import { roundOfDay } from "@/domain/plan/week";
import { getWeek, useData } from "@/state/store";
import { MealSheet } from "./MealSheet";
import { RoundBuilder } from "./RoundBuilder";
import { RoundCard } from "./RoundCard";
import styles from "./Plan.module.css";

export function PlanScreen() {
  const data = useData();
  const params = useSearchParams();
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [meal, setMeal] = useState<{ day: number; slot: SlotId } | null>(null);
  const building = params.get("build") as RoundId | null;

  if (!data) return <div className={styles.loading} aria-busy="true" />;

  const today = today0();
  const weekStart = addDays(sundayOf(today), offset * 7);
  const key = weekKey(weekStart);
  const week = getWeek(data, key);
  const thisWeek = offset === 0;
  const build = (id: RoundId | null) => router.replace(id ? `/plan?build=${id}` : "/plan", { scroll: false });

  return (
    <div className={styles.screen}>
      <header className={styles.head}>
        <div>
          <span className="t-eyebrow">Plan</span>
          <h1 className="t-h1">{thisWeek ? "This week" : offset === 1 ? "Next week" : `Week of ${dateLabel(weekStart)}`}</h1>
        </div>
        <div className={styles.weekNav}>
          <IconButton label="Previous week" onClick={() => setOffset((o) => o - 1)}>
            <Icon name="back" size={20} />
          </IconButton>
          <IconButton label="Next week" onClick={() => setOffset((o) => o + 1)}>
            <Icon name="chevron" size={20} />
          </IconButton>
        </div>
      </header>

      <ol className={styles.strip} aria-label="Days">
        {DAYS.map((name, d) => {
          const date = addDays(weekStart, d);
          const R = roundOfDay(week, d);
          const isToday = ymd(date) === ymd(today);
          return (
            <li key={d} className={`${styles.day} ${styles[R.id]}`} data-today={isToday || undefined} aria-current={isToday ? "date" : undefined}>
              <span className={styles.dayName}>{name}</span>
              <b>{date.getDate()}</b>
              {R.cook === d ? <span className={styles.cookDot} aria-label="Cook day" /> : <span className={styles.dotSpace} />}
            </li>
          );
        })}
      </ol>

      {!thisWeek && (
        <button type="button" className={styles.link} onClick={() => setOffset(0)}>
          Back to this week
        </button>
      )}

      {week.rounds.map((R) => (
        <RoundCard key={R.id} round={R} week={week} weekStart={weekStart} onPlan={() => build(R.id)} onMeal={(day, slot) => setMeal({ day, slot })} />
      ))}

      <MealSheet weekKey={key} week={week} prefs={data.prefs} meal={meal} onClose={() => setMeal(null)} />

      {building && week.rounds.some((R) => R.id === building) && (
        <RoundBuilder
          key={`${key}-${building}`}
          weekKey={key}
          weekStart={weekStart}
          round={week.rounds.find((R) => R.id === building)!}
          prefs={data.prefs}
          onClose={() => build(null)}
        />
      )}
    </div>
  );
}
