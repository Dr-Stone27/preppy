"use client";

import { count } from "@/lib/words";
import { track } from "@/lib/analytics";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { FilterChip } from "@/components/ui/Chip";
import { lastCookFresh, dishesUsingLeftovers } from "@/domain/plan/useup";
import { cardLabel, CUISINE_LABEL, cuisinesIn, filterRecipes } from "@/domain/recipes/search";
import type { CuisineFamily } from "@/domain/bowl/types";
import { BowlCollage } from "@/components/bowl/BowlCollage";
import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/Layout";
import { dayName } from "@/domain/plan/dates";
import type { Prefs, Round } from "@/domain/plan/types";
import { dayMacros, fillCells, recipesFor, roundLabel, roundRange, SLOTS } from "@/domain/plan/week";
import { sharedBases } from "@/domain/plan/cook";
import { libraryRecipes, recipeById, recipeHref } from "@/domain/recipes/library";
import { ruleWarnings } from "@/domain/recipes/rules";
import type { Recipe } from "@/domain/recipes/types";
import { updateWeek, useData } from "@/state/store";
import styles from "./RoundBuilder.module.css";

type Props = { weekKey: string; weekStart: Date; round: Round; prefs: Prefs; onClose: () => void };
type Step = 1 | 2 | 3 | "done";

/** Full-screen, three steps: mains, then breakfast and sweets, then a review before the timetable is filled. */
export function RoundBuilder({ weekKey, weekStart, round: R, prefs, onClose }: Props) {
  // The step lives in the address, so the phone's back gesture goes back a step and a reload stays put.
  const params = useSearchParams();
  const router = useRouter();
  const [done, setDone] = useState(false);
  const urlStep = Number(params.get("step"));
  const step: Step = done ? "done" : urlStep === 2 || urlStep === 3 ? urlStep : 1;
  const setStep = (n: Step) => {
    if (n === "done") return setDone(true);
    router.push(`/plan?build=${R.id}&step=${n}`, { scroll: false });
  };
  // Picks survive a reload until the cook is saved.
  const draftKey = `preppy:pick:${weekKey}:${R.id}`;
  const [draft] = useState(() => readDraft(draftKey));
  const [arriving] = useState(() => recipeById(params.get("add") ?? ""));
  const withArriving = (list: string[], kind: "main" | "sweet") =>
    arriving && arriving.kind === kind && !list.includes(arriving.id) ? [...list, arriving.id] : list;
  const [mains, setMains] = useState<string[]>(() => withArriving(draft?.mains ?? R.mains, "main"));
  const [sweets, setSweets] = useState<string[]>(() => withArriving(draft?.sweets ?? R.sweets, "sweet"));
  useEffect(() => writeDraft(draftKey, { mains, sweets }), [draftKey, mains, sweets]);
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState<CuisineFamily | "all">("all");
  const data = useData();
  const leftovers = useMemo(() => (data ? lastCookFresh(data.weeks, weekKey, R) : null), [data, weekKey, R]);

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
    writeDraft(draftKey, null);
    setStep("done");
  };

  const back = step === 2 || step === 3;
  let body: ReactNode = null;
  let foot: ReactNode = null;

  if (step === 1 || step === 2) {
    const kind = step === 1 ? "main" : "sweet";
    const picked = step === 1 ? mains : sweets;
    const setPicked = step === 1 ? setMains : setSweets;
    const all = libraryRecipes().filter((r) => r.kind === kind);
    const list = filterRecipes(all, { query, kind: "all", cuisine: step === 1 ? cuisine : "all" });
    const cuisines = step === 1 ? cuisinesIn(all) : [];
    const useUp = step === 1 && leftovers && !query && cuisine === "all" ? dishesUsingLeftovers(all.filter((r) => !ruleWarnings(r, prefs.never).items.length), leftovers) : [];
    const shared = sharedBases(recipesFor(mains));

    body = (
      <>
        <div className={styles.intro}>
          <h1 className="t-h1">{step === 1 ? "Choose your mains" : "Breakfast and sweets"}</h1>
          <p className="t-muted">
            {step === 1
              ? `Pick what to cook on ${dayName(weekStart, R.cook, true)}. Two or three is easiest to cook in one go, and different flavours keep the week interesting.`
              : "Quick to make fresh each day. Skip this if you eat breakfast out."}
          </p>
        </div>

        {step === 1 && mains.length > 0 && (
          <div className={styles.ok} role="status">
            {shared.length
              ? `${shared[0].dishes.join(" and ")} share the ${shared[0].base.name.toLowerCase()}, so you make it once.`
              : `${count(mains.length, "main")} picked.`}
          </div>
        )}

        {useUp.length > 0 && leftovers && (
          <section className={styles.useUp} aria-label="Use it up">
            <h2 className="t-h3">Use it up</h2>
            <p className="t-small t-muted">These use fresh food you bought for {leftovers.label}.</p>
            <div className={styles.grid}>
              {useUp.map(({ recipe: r, uses }) => (
                <PickCard
                  key={r.id}
                  recipe={r}
                  never={prefs.never}
                  selected={picked.includes(r.id)}
                  onToggle={() => toggle(setPicked, r.id)}
                  note={`Uses ${uses.slice(0, 3).join(", ")}`}
                />
              ))}
            </div>
          </section>
        )}

        {all.length > 6 && (
          <div className={styles.finder}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={step === 1 ? "Search mains or ingredients" : "Search breakfasts and sweets"}
              aria-label="Search dishes"
              autoComplete="off"
            />
            {cuisines.length > 1 && (
              <div className={styles.cuisines} role="group" aria-label="Cuisine">
                <FilterChip selected={cuisine === "all"} onClick={() => setCuisine("all")}>
                  All
                </FilterChip>
                {cuisines.map((c) => (
                  <FilterChip key={c} selected={cuisine === c} onClick={() => setCuisine(cuisine === c ? "all" : c)}>
                    {CUISINE_LABEL[c]}
                  </FilterChip>
                ))}
              </div>
            )}
          </div>
        )}

        {list.length ? (
          <div className={styles.grid}>
            {list.map((r) => (
              <PickCard key={r.id} recipe={r} never={prefs.never} selected={picked.includes(r.id)} onToggle={() => toggle(setPicked, r.id)} />
            ))}
          </div>
        ) : all.length ? (
          <EmptyState title="Nothing matches" body="Try another word, or clear the filter." />
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
          {sweets.length ? "Next" : "Skip, no sweets this cook"}
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
          <h1 className="t-h1">Check your cook</h1>
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
        {R.confirmed && <p className="t-small t-muted">Saving replaces this cook’s timetable, including any meals you changed by hand.</p>}
      </>
    );
    foot = (
      <Button block onClick={confirm}>
        Save this cook
      </Button>
    );
  }

  if (step === "done") {
    body = (
      <div className={styles.done}>
        <div className={styles.hero}>
          <BowlCollage recipes={recipesFor(mains)} size={90} />
        </div>
        <h1 className="t-h1">Cook planned</h1>
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
        <IconButton label={back ? "Back" : "Close"} onClick={() => (back ? router.back() : onClose())}>
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

function PickCard({ recipe: r, never, selected, onToggle, note }: { recipe: Recipe; never: string[]; selected: boolean; onToggle: () => void; note?: string }) {
  const { items } = ruleWarnings(r, never);
  const m = r.macros;
  return (
    <div className={styles.pickWrap}>
      <button type="button" className={styles.pick} aria-pressed={selected} onClick={onToggle}>
        {selected && (
          <span className={styles.tick} aria-hidden>
            <Icon name="check" size={16} strokeWidth={2.4} />
          </span>
        )}
        <BowlIllustration recipe={r} size={88} decorative />
        <span className={styles.pickTitle}>{r.title}</span>
        <span className={styles.pickMeta}>
          <Tag tone="accent">{cardLabel(r)}</Tag>
          {m?.protein ? <span className="t-label t-muted">{m.protein} g protein</span> : null}
        </span>
        {note && <span className={styles.pickNote}>{note}</span>}
        {items.length > 0 && <span className={styles.pickWarn}>Has {items.join(", ")}</span>}
      </button>
      <Link href={recipeHref(r)} className={styles.pickInfo} aria-label={`See the recipe for ${r.title}`}>
        Recipe
      </Link>
    </div>
  );
}

type Draft = { mains: string[]; sweets: string[] };

function readDraft(key: string): Draft | null {
  try {
    const d = typeof window === "undefined" ? null : JSON.parse(sessionStorage.getItem(key) ?? "null");
    return d && Array.isArray(d.mains) && Array.isArray(d.sweets) ? d : null;
  } catch {
    return null;
  }
}

function writeDraft(key: string, d: Draft | null) {
  try {
    if (d) sessionStorage.setItem(key, JSON.stringify(d));
    else sessionStorage.removeItem(key);
  } catch {}
}
