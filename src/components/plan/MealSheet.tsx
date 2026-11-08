"use client";

import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { FilterChip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { DAY_FULL } from "@/domain/plan/dates";
import type { Prefs, SlotId, Week } from "@/domain/plan/types";
import { cellKey, recipesFor, roundOfDay, SLOTS } from "@/domain/plan/week";
import { myRecipes } from "@/domain/recipes/library";
import type { Recipe } from "@/domain/recipes/types";
import { updateWeek } from "@/state/store";
import styles from "./Plan.module.css";

type Props = {
  weekKey: string;
  week: Week;
  prefs: Prefs;
  meal: { day: number; slot: SlotId } | null;
  onClose: () => void;
};

function macroLine(r: Recipe) {
  const m = r.macros;
  return [r.flavour, m?.kcal ? `${m.kcal.toLocaleString()} kcal` : "", m?.protein ? `${m.protein} g protein` : ""].filter(Boolean).join(" · ");
}

/** Change, clear or add a side to one meal in the timetable. */
export function MealSheet({ weekKey, week, prefs, meal, onClose }: Props) {
  const slot = meal ? SLOTS.find((s) => s.id === meal.slot)! : null;
  const key = meal ? cellKey(meal.day, meal.slot) : "";
  const cell = meal ? week.cells[key] : undefined;
  const R = meal ? roundOfDay(week, meal.day) : null;
  const inRound = slot && R ? recipesFor(slot.kind === "main" ? R.mains : R.sweets) : [];
  const others = slot ? myRecipes().filter((r) => r.kind === slot.kind && !inRound.some((x) => x.id === r.id)) : [];

  const set = (patch: (c: Week["cells"][string] | undefined) => Week["cells"][string] | undefined) =>
    updateWeek(weekKey, (w) => {
      const next = patch(w.cells[key]);
      if (next) w.cells[key] = next;
      else delete w.cells[key];
      return w;
    });

  const option = (r: Recipe) => (
    <button
      key={r.id}
      type="button"
      className={styles.option}
      aria-pressed={cell?.r === r.id}
      onClick={() => set((c) => ({ ...c, r: r.id }))}
    >
      <BowlIllustration recipe={r} size={44} decorative />
      <span className={styles.optionText}>
        <span className={styles.optionTitle}>{r.title}</span>
        <span className="t-label t-muted">{macroLine(r)}</span>
      </span>
      {cell?.r === r.id && <Icon name="check" size={20} />}
    </button>
  );

  return (
    <BottomSheet
      open={!!meal}
      onClose={onClose}
      title={meal && slot ? `${DAY_FULL[meal.day]} ${slot.label.toLowerCase()}` : ""}
      footer={
        <div className={styles.sheetActions}>
          {cell && (
            <Button
              variant="text"
              size="sm"
              onClick={() => {
                set(() => undefined);
                onClose();
              }}
            >
              Clear this meal
            </Button>
          )}
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      {meal && slot && R && (
        <div className={styles.sheetBody}>
          {inRound.length ? (
            <div className={styles.options}>{inRound.map(option)}</div>
          ) : (
            <p className="t-small t-muted">No {slot.kind === "main" ? "mains" : "breakfasts or sweets"} picked for this round yet.</p>
          )}

          {others.length > 0 && (
            <details className={styles.more}>
              <summary>Other recipes ({others.length})</summary>
              <div className={styles.options}>{others.map(option)}</div>
            </details>
          )}

          {slot.kind === "main" && prefs.bases.length > 0 && cell && (
            <div className={styles.sides}>
              <span className="t-eyebrow">Serve with</span>
              <div className={styles.chips}>
                {prefs.bases.map((b) => (
                  <FilterChip key={b} selected={cell.base === b} onClick={() => set((c) => (c ? { ...c, base: c.base === b ? undefined : b } : c))}>
                    {b}
                  </FilterChip>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
