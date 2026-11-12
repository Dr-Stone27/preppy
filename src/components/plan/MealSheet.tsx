"use client";

import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { FilterChip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { dayName, weekStartFromKey } from "@/domain/plan/dates";
import type { Prefs, SlotId, Week } from "@/domain/plan/types";
import { cellKey, needs, recipesFor, roundOfDay, slug, SLOTS } from "@/domain/plan/week";
import { pantryItem } from "@/domain/shop/pantry";
import { libraryRecipes } from "@/domain/recipes/library";
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
  // For a main, other dishes that use fresh food already on this cook's list come first: swapping to one adds less shopping.
  const onList = slot?.kind === "main" && R ? new Set(needs(R, week.cells).filter((l) => !pantryItem(l.key) || pantryItem(l.key)!.fresh).map((l) => l.key)) : new Set<string>();
  const shared = (r: Recipe) => new Set(r.ingredients.map((i) => slug(i.name)).filter((k) => onList.has(k))).size;
  const others = slot
    ? libraryRecipes()
        .filter((r) => r.kind === slot.kind && !inRound.some((x) => x.id === r.id))
        .map((r) => ({ r, n: shared(r) }))
        .sort((a, b) => b.n - a.n || a.r.title.localeCompare(b.r.title))
    : [];

  const set = (patch: (c: Week["cells"][string] | undefined) => Week["cells"][string] | undefined) =>
    updateWeek(weekKey, (w) => {
      const next = patch(w.cells[key]);
      if (next) w.cells[key] = next;
      else delete w.cells[key];
      return w;
    });

  const option = (r: Recipe, n = 0) => (
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
        {n >= 2 && <span className={styles.sharedNote}>Uses {n} fresh things already on your list</span>}
      </span>
      {cell?.r === r.id && <Icon name="check" size={20} />}
    </button>
  );

  return (
    <BottomSheet
      open={!!meal}
      onClose={onClose}
      title={meal && slot ? `${dayName(weekStartFromKey(weekKey), meal.day, true)} ${slot.label.toLowerCase()}` : ""}
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
            <div className={styles.options}>{inRound.map((r) => option(r))}</div>
          ) : (
            <p className="t-small t-muted">No {slot.kind === "main" ? "mains" : "breakfasts or sweets"} picked for this cook yet.</p>
          )}

          {others.length > 0 && (
            <details className={styles.more}>
              <summary>
                Other recipes ({others.length}){slot.kind === "main" && others[0]?.n >= 2 ? ", least extra shopping first" : ""}
              </summary>
              <div className={styles.options}>{others.map(({ r, n }) => option(r, n))}</div>
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
