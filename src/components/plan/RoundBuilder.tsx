"use client";

import { count } from "@/lib/words";
import { track } from "@/lib/analytics";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { BowlCollage } from "@/components/bowl/BowlCollage";
import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/Layout";
import { dayName } from "@/domain/plan/dates";
import type { Prefs, Round } from "@/domain/plan/types";
import { dayMacros, eggCount, fillCells, recipesFor, repeatedFlavours, roundLabel, roundRange, SLOTS } from "@/domain/plan/week";
import { libraryRecipes } from "@/domain/recipes/library";
import { ruleWarnings } from "@/domain/recipes/rules";
import type { Recipe } from "@/domain/recipes/types";
import { updateWeek } from "@/state/store";
import styles from "./RoundBuilder.module.css";

type Props = { weekKey: string; weekStart: Date; round: Round; prefs: Prefs; onClose: () => void };
type Step = 1 | 2 | 3 | "done";

/** Full-screen, three steps: mains, then breakfast and sweets, then a review before the timetable is filled. */
export function RoundBuilder({ weekKey, weekStart, round: R, prefs, onClose }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [mains, setMains] = useState<string[]>(R.mains);
  const [sweets, setSweets] = useState<string[]>(R.sweets);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    document.getElementById("builder-scroll")?.scrollTo(0, 0);
  }, [step]);

  const cells = useMemo(() => fillCells(R, mains, sweets, prefs.bases), [R, mains, sweets, prefs.bases]);
  const toggle = (set: (fn: (v: string[]) => string[]) => void, id: string) =>
    set((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const confirm = () => {
    updateWeek(weekKey, (w) => {
      const round = w.rounds.find((x) => x.id === R.id)!;
      round.mains = mains;
      round.sweets = sweets;
      round.confirmed = true;
      for (const d of round.days) for (const s of SLOTS) delete w.cells[`${d}|${s.id}`];
      Object.assign(w.cells, cells);
      return w;
    });
    track("round_planned", { mains: mains.length, sweets: sweets.length });
    setStep("done");
  };

  const back = step === 2 || step === 3;
  let body: ReactNode = null;
  let foot: ReactNode = null;

  if (step === 1 || step === 2) {
    const kind = step === 1 ? "main" : "sweet";
    const picked = step === 1 ? mains : sweets;
    const setPicked = step === 1 ? setMains : setSweets;
    const list = libraryRecipes().filter((r) => r.kind === kind);
    const variety = repeatedFlavours(mains);
    const eggs = eggCount(R, cells);

    body = (
      <>
        <div className={styles.intro}>
          <h1 className="t-h1">{step === 1 ? "Choose your mains" : "Breakfast and sweets"}</h1>
          <p className="t-muted">
            {step === 1
              ? `Pick what to cook on ${dayName(weekStart, R.cook, true)}. Two or three is easiest to cook in one go, and different flavours keep the week interesting.`
              : "Quick to make fresh each day. A good place to hide eggs."}
          </p>
        </div>

        {step === 1 && mains.length > 0 && (
          <div className={variety.repeats.length ? styles.warn : styles.ok} role="status">
            {variety.repeats.length
              ? `More than one main is ${variety.repeats.join(" and ")}. Swap one for variety.`
              : `${mains.length} ${mains.length > 1 ? "mains" : "main"}, ${variety.flavours} ${variety.flavours > 1 ? "flavours" : "flavour"}. No repeats.`}
          </div>
        )}
        {step === 2 && sweets.length > 0 && (
          <div className={styles.ok} role="status">
            {eggs ? `${count(eggs, "egg")} this round, all inside these.` : "No eggs in these."}
          </div>
        )}

        {list.length ? (
          <div className={styles.grid}>
            {list.map((r) => (
              <PickCard key={r.id} recipe={r} never={prefs.never} selected={picked.includes(r.id)} onToggle={() => toggle(setPicked, r.id)} />
            ))}
          </div>
        ) : (
          <EmptyState title={step === 1 ? "No mains saved yet" : "No breakfasts or sweets saved yet"} />
        )}
      </>
    );
    foot =
      step === 1 ? (
        <Button block disabled={!mains.length} onClick={() => setStep(2)}>
          {mains.length ? "Next" : "Pick at least one main"}
        </Button>
      ) : (
        <Button block onClick={() => setStep(3)}>
          {sweets.length ? "Next" : "Skip, no sweets this round"}
        </Button>
      );
  }

  if (step === 3) {
    const all = R.days.map((d) => dayMacros(d, cells));
    const known = all.reduce((a, m) => a + m.known, 0);
    const unknown = all.reduce((a, m) => a + m.unknown, 0);
    // A daily figure built from a few meals reads as a mistake ("430 kcal a day"), so show it only when most meals have numbers.
    const enough = known > 0 && known / (known + unknown) >= 0.75;
    const days = enough ? all.filter((m) => m.known) : [];
    const kcal = days.length ? Math.round(days.reduce((a, m) => a + m.kcal, 0) / days.length) : null;
    const protein = days.length ? Math.round(days.reduce((a, m) => a + m.protein, 0) / days.length) : null;
    const partial = enough && unknown > 0;
    const dishes = recipesFor([...mains, ...sweets]);
    const meals = (id: string) => Object.values(cells).filter((c) => c.r === id).length;

    body = (
      <>
        <div className={styles.intro}>
          <h1 className="t-h1">Check your round</h1>
          <p className="t-muted">{roundRange(weekStart, R)}</p>
        </div>
        <div className={styles.hero}>
          <BowlCollage recipes={dishes} size={84} />
        </div>
        <dl className={styles.stats}>
          {kcal != null && (
            <div>
              <dt>kcal a day{partial ? "*" : ""}</dt>
              <dd>{kcal.toLocaleString()}</dd>
            </div>
          )}
          {protein != null && (
            <div>
              <dt>g protein a day{partial ? "*" : ""}</dt>
              <dd>{protein}</dd>
            </div>
          )}
          <div>
            <dt>eggs</dt>
            <dd>{eggCount(R, cells)}</dd>
          </div>
          <div>
            <dt>meals</dt>
            <dd>{Object.keys(cells).length}</dd>
          </div>
        </dl>
        {partial && <p className="t-label t-muted">* Some dishes have no nutrition info, so the real numbers are higher.</p>}
        {kcal == null && <p className="t-label t-muted">{known ? "Too few of these dishes have nutrition info to add up a day." : "None of these dishes have nutrition info."}</p>}
        <ul className={styles.review}>
          {dishes.map((r) => (
            <li key={r.id}>
              <BowlIllustration recipe={r} size={44} decorative />
              <span>
                <span className={styles.reviewTitle}>{r.title}</span>
                <span className="t-label t-muted">
                  {r.kind === "sweet" ? "Made fresh" : `Cooked ${dayName(weekStart, R.cook, true)}`} · {count(meals(r.id), "meal")}
                </span>
              </span>
            </li>
          ))}
        </ul>
        {R.confirmed && <p className="t-small t-muted">Saving replaces this round’s timetable, including any meals you changed by hand.</p>}
      </>
    );
    foot = (
      <Button block onClick={confirm}>
        Save round
      </Button>
    );
  }

  if (step === "done") {
    body = (
      <div className={styles.done}>
        <div className={styles.hero}>
          <BowlCollage recipes={recipesFor(mains)} size={90} />
        </div>
        <h1 className="t-h1">Round planned</h1>
        <p className="t-muted">
          {count(Object.keys(cells).length, "meal")} from {dayName(weekStart, R.days[0], true)} to {dayName(weekStart, R.days.at(-1)!, true)}.
        </p>
      </div>
    );
    foot = (
      <>
        <ButtonLink href={`/shop?week=${weekKey}&round=${R.id}`} block>
          See shopping list
        </ButtonLink>
        <Button variant="secondary" block onClick={onClose}>
          See the timetable
        </Button>
      </>
    );
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`Plan ${roundLabel(R, weekStart)}`}>
      <div className={styles.top}>
        <IconButton label={back ? "Back" : "Close"} onClick={() => (back ? setStep((s) => ((s as number) - 1) as Step) : onClose())}>
          <Icon name={back ? "back" : "close"} size={20} />
        </IconButton>
        {step !== "done" && (
          <span className={styles.progress} aria-label={`Step ${step} of 3`}>
            {[1, 2, 3].map((n) => (
              <i key={n} data-on={n <= (step as number) || undefined} />
            ))}
          </span>
        )}
        <span className={`t-label t-muted ${styles.which}`}>{roundLabel(R, weekStart)}</span>
      </div>
      <div id="builder-scroll" className={styles.scroll}>
        <div className={styles.body}>{body}</div>
      </div>
      <div className={styles.foot}>{foot}</div>
    </div>
  );
}

function PickCard({ recipe: r, never, selected, onToggle }: { recipe: Recipe; never: string[]; selected: boolean; onToggle: () => void }) {
  const { items } = ruleWarnings(r, never);
  const m = r.macros;
  return (
    <button type="button" className={styles.pick} aria-pressed={selected} onClick={onToggle}>
      {selected && (
        <span className={styles.tick} aria-hidden>
          <Icon name="check" size={16} strokeWidth={2.4} />
        </span>
      )}
      <BowlIllustration recipe={r} size={88} decorative />
      <span className={styles.pickTitle}>{r.title}</span>
      <span className={styles.pickMeta}>
        {r.flavour && <Tag tone="accent">{r.flavour}</Tag>}
        {m?.protein ? <span className="t-label t-muted">{m.protein} g protein</span> : null}
      </span>
      {items.length > 0 && <span className={styles.pickWarn}>Has {items.join(", ")}</span>}
    </button>
  );
}
