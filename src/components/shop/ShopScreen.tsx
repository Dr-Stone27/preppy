"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Layout";
import { dayName, today0, weekKey, weekStartFromKey } from "@/domain/plan/dates";
import type { RoundId } from "@/domain/plan/types";
import { nextRound, roundDates, roundLabel, weekStartFor } from "@/domain/plan/week";
import { getWeek, useData } from "@/state/store";
import { AtHome } from "./AtHome";
import { StockUp } from "./StockUp";
import { ToBuy } from "./ToBuy";
import styles from "./Shop.module.css";

type View = "buy" | "home" | "stock";
const VIEWS: { id: View; label: string }[] = [
  { id: "buy", label: "To buy" },
  { id: "home", label: "At home" },
  { id: "stock", label: "Stock up" },
];

export function ShopScreen() {
  const data = useData();
  const params = useSearchParams();
  const router = useRouter();
  if (!data) return <div className={styles.loading} aria-busy="true" />;

  const view = (params.get("view") as View) || "buy";
  const today = today0();
  const wParam = params.get("week");
  const weekStart = wParam && /^w-\d{4}-\d{2}-\d{2}$/.test(wParam) ? weekStartFromKey(wParam) : weekStartFor(data.weeks, data.prefs, today);
  const key = weekKey(weekStart);
  const week = getWeek(data, key);
  const rParam = params.get("round") as RoundId | null;
  const R = week.rounds.find((x) => x.id === rParam) ?? nextRound(week, weekStart, today) ?? week.rounds[0];

  const go = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) next.set(k, v);
    if (next.get("view") === "buy") next.delete("view");
    router.replace(`/shop${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  return (
    <div className={styles.screen}>
      <header className={styles.head}>
        <span className="t-eyebrow">Shop</span>
        <h1 className="t-h1">{VIEWS.find((v) => v.id === view)?.label}</h1>
      </header>

      <div className={styles.segment} role="tablist" aria-label="Shopping">
        {VIEWS.map((v) => (
          <button key={v.id} type="button" role="tab" aria-selected={view === v.id} onClick={() => go({ view: v.id })}>
            {v.label}
          </button>
        ))}
      </div>

      {view === "home" && <AtHome statuses={data.pantry} />}
      {view === "stock" && <StockUp statuses={data.pantry} bases={data.prefs.bases} />}
      {view === "buy" && (
        <>
          <div className={styles.rounds} role="group" aria-label="Round">
            {week.rounds.map((x) => (
              <button key={x.id} type="button" aria-pressed={x.id === R.id} onClick={() => go({ round: x.id })}>
                {roundLabel(x, weekStart)} · {dayName(weekStart, x.cook)} {roundDates(weekStart, x).cook.getDate()}
              </button>
            ))}
          </div>
          {R.mains.length || R.sweets.length ? (
            <ToBuy weekKey={key} week={week} round={R} statuses={data.pantry} />
          ) : (
            <EmptyState
              title="Nothing to buy yet"
              body={`Plan the ${roundLabel(R, weekStart).toLowerCase()} and its shopping list fills in.`}
              action={
                <ButtonLink href={`/plan?build=${R.id}`} size="sm">
                  Plan this round
                </ButtonLink>
              }
            />
          )}
        </>
      )}
    </div>
  );
}
