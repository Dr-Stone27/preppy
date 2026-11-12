"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { addDays, dateLabel, dayName, today0, weekKey, ymd } from "@/domain/plan/dates";
import type { RoundId, SlotId } from "@/domain/plan/types";
import { openWeekStart, roundIsOpen, roundLabel, roundOfDay, stepWeek, weekStartFor } from "@/domain/plan/week";
import { getWeek, repeatWeek, useData } from "@/state/store";
import { MealSheet } from "./MealSheet";
import { RoundBuilder } from "./RoundBuilder";
import { RoundCard } from "./RoundCard";
import styles from "./Plan.module.css";

export function PlanScreen() {
  const data = useData();
  const params = useSearchParams();
  const router = useRouter();
  // null until someone moves between weeks: until then the screen opens on the week that still has something to plan.
  const [picked, setPicked] = useState<number | null>(() => (params.get("week") === "next" ? 1 : null));
  const [meal, setMeal] = useState<{ day: number; slot: SlotId } | null>(null);
  const [copied, setCopied] = useState("");
  const building = params.get("build") as RoundId | null;

  if (!data) return <div className={styles.loading} aria-busy="true" />;

  const today = today0();
  const open = openWeekStart(data.weeks, data.prefs, today, (k) => getWeek(data, k));
  const offset = picked ?? (open.moved ? 1 : 0);
  const setOffset = (fn: (o: number) => number) => setPicked(fn(offset));
  let weekStart = weekStartFor(data.weeks, data.prefs, today);
  for (let n = 0; n < Math.abs(offset); n++) weekStart = stepWeek(data.weeks, data.prefs, weekStart, offset > 0 ? 1 : -1);
  const key = weekKey(weekStart);
  const week = getWeek(data, key);
  const thisWeek = offset === 0;
  // On this week, a cook that's over and was never planned is just noise.
  const shown = thisWeek ? week.rounds.filter((R) => R.confirmed || roundIsOpen(R, weekStart, today)) : week.rounds;
  const passed = thisWeek ? week.rounds.filter((R) => !shown.includes(R)) : [];
  // Offer last week's cooks when nothing here is planned yet.
  const prevKey = weekKey(stepWeek(data.weeks, data.prefs, weekStart, -1));
  const canRepeat = !week.rounds.some((R) => R.confirmed) && !!data.weeks[prevKey]?.rounds.some((R) => R.confirmed) && shown.length > 0;
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
        {Array.from({ length: 7 }, (_, d) => {
          const name = dayName(weekStart, d);
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

      {picked === null && open.moved && <p className="t-small t-muted">This week’s cook days have passed, so here’s next week.</p>}

      {!thisWeek && (
        <button type="button" className={styles.link} onClick={() => setOffset(() => 0)}>
          Back to this week
        </button>
      )}

      {thisWeek && passed.length > 0 && (
        <p className="t-small t-muted">
          {passed.map((R) => roundLabel(R, weekStart)).join(" and ")} {passed.length > 1 ? "have" : "has"} passed.
        </p>
      )}

      {canRepeat && (
        <div className={styles.repeat}>
          <p className="t-small">Last week’s cooks are planned. Use them again?</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const n = repeatWeek(prevKey, key);
              setCopied(n ? `Copied ${n === 1 ? "1 cook" : `${n} cooks`} from last week. Change anything you like.` : "");
            }}
          >
            Repeat last week
          </Button>
        </div>
      )}
      {copied && (
        <p className="t-small" role="status">
          {copied}
        </p>
      )}

      {shown.map((R) => (
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
