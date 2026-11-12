"use client";

import { count } from "@/lib/words";
import { track } from "@/lib/analytics";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { AccountPanel } from "@/components/account/AccountPanel";
import { useSync } from "@/state/sync";
import { BowlCollage } from "@/components/bowl/BowlCollage";
import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/Layout";
import { cookDishes, fallbackPlan, keepApart, planFromAi, sharedBases, startTheDayBefore, storePlan } from "@/domain/plan/cook";
import { baseById, baseOf } from "@/domain/recipes/bases";
import { today0, weekKey, weekStartFromKey } from "@/domain/plan/dates";
import type { RoundId } from "@/domain/plan/types";
import { roundLabel, weekStartFor } from "@/domain/plan/week";
import { allRecipes } from "@/domain/recipes/library";
import { authHeader } from "@/lib/supabase";
import { shopLines } from "@/domain/shop/list";
import { getWeek, updateWeek, useData } from "@/state/store";
import builder from "./RoundBuilder.module.css";
import styles from "./CookDay.module.css";

/** A running timer: the step it belongs to, the dish it's for, and when it ends. Several can run at once. */
type Timer = { step: number; dish: string; end: number };

/** Timers are kept for this cook while the tab is open, so leaving cook day or reloading doesn't lose them. */
const timerStore = (week: string | null, round: string | null) => `preppy:timers:${week ?? ""}:${round ?? ""}`;
function loadTimers(k: string): Timer[] {
  try {
    const t = JSON.parse(sessionStorage.getItem(k) ?? "[]") as Timer[];
    return Array.isArray(t) ? t.filter((x) => x.end > Date.now() - 60 * 60_000) : [];
  } catch {
    return [];
  }
}
function saveTimers(k: string, t: Timer[]) {
  try {
    sessionStorage.setItem(k, JSON.stringify(t));
  } catch {
    /* private mode: timers still run for this visit */
  }
}

/** A dish's name short enough for a timer pill: "Party Jollof Rice with Chicken" becomes "Party Jollof Rice". */
const shortName = (title: string) => title.split(/ with | \(|,/)[0].trim();

// The words you glance at from the stove: times, heat, temperatures and amounts.
const KEY_WORDS =
  /(\d+(?:\s*[–-]\s*\d+)?\s*(?:minutes?|mins?|hours?|hrs?|seconds?|secs?)|(?:low|medium|high)(?:[- ](?:low|high))?(?:\s+heat)|\d+\s*°\s*[CF]?|(?:\d+(?:\.\d+)?|[½¼¾⅓⅔])\s*(?:g|kg|ml|l|cups?|tbsp|tsp)\b)/gi;

function tinted(text: string): ReactNode {
  return text.split(KEY_WORDS).map((part, n) => (n % 2 ? <mark key={n} className={styles.key}>{part}</mark> : part));
}

/** Read only from event handlers and timers, never while rendering. */
const timeNow = () => Date.now();

/**
 * Minutes for a step's timer: the step's own, or read from its text ("for 25–30 minutes" gives 30).
 * Only the last time mentioned counts, since that's usually the one you wait for.
 */
function timerMinutes(minutes: number | null | undefined, text: string): number | undefined {
  if (minutes) return minutes;
  const all = [...text.matchAll(/(\d+)(?:\s*[–-]\s*(\d+))?\s*(?:minutes?|mins?)\b/gi)];
  const last = all.at(-1);
  const n = last ? Number(last[2] ?? last[1]) : 0;
  return n >= 2 && n <= 240 ? n : undefined;
}

const clock = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

export function CookDay() {
  const data = useData();
  const params = useSearchParams();
  const router = useRouter();
  // The step lives in the address, so a reload or the phone's back button keeps your place.
  const stepParam = Number(params.get("step") ?? -1);
  const setI = (n: number) => {
    const q = new URLSearchParams(params.toString());
    if (n < 0) q.delete("step");
    else q.set("step", String(n));
    router.replace(`/plan/cook?${q}`, { scroll: false });
  };
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  // The combined order needs an account. Signed-out cooks sign in here, or choose each recipe in turn.
  const [signInNeeded, setSignInNeeded] = useState(false);
  const sync = useSync();
  const store = timerStore(params.get("week"), params.get("round"));
  const [timers, setTimersState] = useState<Timer[]>(() => (typeof window === "undefined" ? [] : loadTimers(store)));
  const setTimers = (t: Timer[]) => {
    setTimersState(t);
    saveTimers(store, t);
  };
  const [now, setNow] = useState(() => Date.now());
  const buzzed = useRef(new Set<number>());

  useEffect(() => {
    if (!timers.length) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [timers.length]);

  function startTimer(step: number, dish: string, minutes: number) {
    const at = timeNow();
    setNow(at);
    setTimers([...timers, { step, dish, end: at + minutes * 60_000 }]);
  }

  const leftOf = (t: Timer) => Math.max(0, Math.round((t.end - now) / 1000));
  useEffect(() => {
    // Buzz once when each timer runs out (Android; iPhones don't allow it from the web).
    for (const t of timers) {
      if (t.end <= now && !buzzed.current.has(t.end)) {
        buzzed.current.add(t.end);
        navigator.vibrate?.([300, 150, 300]);
      }
    }
  }, [timers, now]);

  useEffect(() => {
    document.getElementById("cook-scroll")?.scrollTo(0, 0);
  }, [stepParam]);

  useEffect(() => track("cook_day_opened"), []);

  if (!data) return <div style={{ minHeight: "60vh" }} aria-busy="true" />;

  const key = params.get("week") ?? weekKey(weekStartFor(data.weeks, data.prefs, today0()));
  const weekStart = weekStartFromKey(key);
  const week = getWeek(data, key);
  const R = week.rounds.find((x) => x.id === (params.get("round") as RoundId)) ?? week.rounds[0];
  const dishes = cookDishes(R, week.cells);
  const plan = R.cookPlan;
  const close = () => router.push("/plan");

  const savePlan = (p: typeof plan) =>
    updateWeek(key, (w) => {
      w.rounds.find((x) => x.id === R.id)!.cookPlan = p;
      return w;
    });

  const workOut = async () => {
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch("/api/cook-order", {
        method: "POST",
        headers: { "content-type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({
          dishes: dishes.map(({ recipe: r, portions }) => ({
            title: r.title,
            portions,
            servings: r.servings,
            ingredients: r.ingredients.map((x) => `${x.qty ?? ""} ${x.unit} ${x.name}`.trim()),
            steps: r.steps,
            base: (() => {
              const b = baseOf(r);
              return b ? baseById(b).name : "";
            })(),
          })),
        }),
      });
      if (res.status === 401) {
        setSignInNeeded(true);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      savePlan(planFromAi((await res.json()).plan));
      setSignInNeeded(false);
      setI(0);
    } catch (e) {
      savePlan(fallbackPlan(R, week.cells));
      setNotice(
        (e as Error).message === "503"
          ? "Working out a combined order isn’t switched on yet, so here’s each recipe in turn."
          : "Couldn’t work out a combined order just now, so here’s each recipe in turn.",
      );
      setI(0);
    } finally {
      setBusy(false);
    }
  };

  const eachInTurn = () => {
    savePlan(fallbackPlan(R, week.cells));
    setSignInNeeded(false);
    setNotice("");
    setI(0);
  };

  const done = () => {
    setTimers([]);
    updateWeek(key, (w) => {
      w.rounds.find((x) => x.id === R.id)!.cooked = true;
      return w;
    });
    router.push("/plan");
  };

  let body: ReactNode;
  let foot: ReactNode = null;
  const steps = plan?.steps ?? [];
  const i = plan && Number.isInteger(stepParam) && stepParam >= 0 ? Math.min(stepParam, steps.length) : -1;

  if (!dishes.length) {
    body = (
      <EmptyState
        title="No mains planned for this cook"
        body="Plan this cook first, then come back to cook it."
        action={
          <ButtonLink href={`/plan?build=${R.id}`} size="sm">
            Plan this cook
          </ButtonLink>
        }
      />
    );
  } else if (i === -1) {
    const fresh = shopLines(R, week, data.pantry).buy.filter((l) => l.fresh);
    body = (
      <>
        <h1 className="t-h1">Ready to cook?</h1>
        <div className={builder.hero}>
          <BowlCollage recipes={dishes.map((d) => d.recipe)} size={84} />
        </div>
        <ul className={builder.review}>
          {dishes.map(({ recipe: r, portions }) => (
            <li key={r.id}>
              <BowlIllustration recipe={r} size={44} decorative />
              <span>
                <span className={builder.reviewTitle}>{r.title}</span>
                <span className="t-label t-muted">{count(portions, "portion")}</span>
              </span>
            </li>
          ))}
        </ul>
        {fresh.length > 0 && (
          <section className={styles.card}>
            <h2 className="t-h3">Fresh things to have ready</h2>
            <div className={styles.chips}>
              {fresh.map((l) => (
                <Tag key={l.key} tone={l.done ? "success" : "warning"}>
                  {l.item?.name ?? l.name}
                </Tag>
              ))}
            </div>
            {fresh.some((l) => !l.done) && <p className="t-label t-muted">The orange ones aren’t ticked off your shopping list yet.</p>}
          </section>
        )}
        {startTheDayBefore(dishes.map((d) => d.recipe)).length > 0 && (
          <section className={styles.card}>
            <h2 className="t-h3">Needs starting the day before</h2>
            <p className="t-small">
              {startTheDayBefore(dishes.map((d) => d.recipe)).join(" and ")} marinates best overnight. If you haven’t started it, marinate it first and give it as long as you can.
            </p>
          </section>
        )}
        {sharedBases(dishes.map((d) => d.recipe)).map(({ base, dishes: titles }) => (
          <section key={base.id} className={styles.card}>
            <h2 className="t-h3">Shared base: {base.name}</h2>
            <p className="t-small">
              {titles.length > 2 ? `${titles.slice(0, -1).join(", ")} and ${titles.at(-1)} all` : `${titles.join(" and ")} both`} start from it. {base.once}
            </p>
          </section>
        ))}
        <p className="t-small t-muted">Breakfasts and sweets aren’t part of the batch. Make them fresh each day.</p>
        {signInNeeded && <WhenSignedIn run={workOut} />}
        {signInNeeded && !sync.email && (
          <section className={styles.card} aria-label="Sign in for one combined order">
            <h2 className="t-h3">One order for everything needs a free account</h2>
            <p className="t-small t-muted">Sign in with the code we email you and Preppy works out the order straight away. Or cook each recipe in turn without signing in.</p>
            <AccountPanel />
            <Button variant="secondary" block onClick={eachInTurn}>
              Cook each recipe in turn instead
            </Button>
          </section>
        )}
      </>
    );
    foot = plan ? (
      <>
        <Button block onClick={() => setI(0)}>
          Start · {steps.length} steps{plan.minutes ? ` · about ${plan.minutes} min` : ""}
        </Button>
        <Button variant="secondary" block disabled={busy} onClick={workOut}>
          {busy ? "Working it out…" : "Work out the order again"}
        </Button>
      </>
    ) : (
      <Button block disabled={busy} onClick={workOut}>
        {busy ? "Working out the order…" : "Work out my cooking order"}
      </Button>
    );
  } else if (i < steps.length) {
    const s = steps[i];
    const r = allRecipes().find((x) => x.title === s.recipe);
    const mine = timers.find((t) => t.step === i);
    const minutes = timerMinutes(s.minutes, s.detail);
    const left = mine ? leftOf(mine) : 0;
    body = (
      <>
        {notice && <p className={styles.notice}>{notice}</p>}
        {timers.length > 0 && (
          <div className={styles.pills} aria-label="Running timers">
            {timers.map((t) => {
              const l = leftOf(t);
              const tr = allRecipes().find((x) => x.title === steps[t.step]?.recipe);
              return (
                <button
                  key={t.end}
                  type="button"
                  className={`${styles.pill} ${l === 0 ? styles.pillDone : ""} ${t.step === i ? styles.pillHere : ""}`}
                  onClick={() => setI(t.step)}
                  aria-label={`${t.dish}: ${l ? `${clock(l)} left` : "time's up"}. Go to step ${t.step + 1}`}
                >
                  {tr && <BowlIllustration recipe={tr} size={22} decorative />}
                  <span className={styles.pillName}>{t.dish}</span>
                  <span className={styles.pillTime}>{l ? clock(l) : "Ready"}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className={styles.bar}>
          <i style={{ width: `${Math.round(((i + 1) / (steps.length + 1)) * 100)}%` }} />
        </div>
        <div className={styles.stepHead}>
          <span className="t-eyebrow">
            Step {i + 1} of {steps.length}
          </span>
          {s.appliance && <Tag tone="warning">{s.appliance}</Tag>}
        </div>
        {(r || s.recipe) && (
          <div className={styles.dish}>
            {r && <BowlIllustration recipe={r} size={40} decorative />}
            <span className="t-small t-muted">{r?.title ?? s.recipe}</span>
          </div>
        )}
        {s.title ? <h1 className="t-h1">{s.title}</h1> : <h1 className="visually-hidden">Step {i + 1}</h1>}
        {s.detail.includes(" · ") && !/[.!?]\s/.test(s.detail) ? (
          // A "get out what you need" step: a checklist, not a sentence.
          <ul className={styles.gather}>
            {s.detail.split(" · ").map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.detail}>{tinted(s.detail)}</p>
        )}
        {s.meanwhile && (
          <p className={styles.meanwhile}>
            <b>Meanwhile:</b> {tinted(s.meanwhile)}
          </p>
        )}
        {minutes && (
          <div className={styles.timer}>
            <span className={styles.clock} aria-live="polite">
              {mine ? clock(left) : `${minutes}:00`}
            </span>
            <span className="t-small t-muted">{mine ? (left ? "Running. It stays at the top while you carry on." : "Time’s up") : `${minutes} minute timer`}</span>
            {mine ? (
              <Button variant="secondary" size="sm" onClick={() => setTimers(timers.filter((t) => t !== mine))}>
                {left ? "Stop" : "Clear"}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => startTimer(i, shortName(r?.title ?? s.recipe ?? "Timer"), minutes)}
              >
                Start
              </Button>
            )}
          </div>
        )}
      </>
    );
    foot = (
      <div className={styles.pair}>
        <Button variant="secondary" onClick={() => setI(i - 1)}>
          Back
        </Button>
        <Button onClick={() => setI(i + 1)}>{i + 1 < steps.length ? "Next" : "Portion and store"}</Button>
      </div>
    );
  } else {
    body = (
      <>
        <span className="t-eyebrow">Last step</span>
        <h1 className="t-h1">Portion and store</h1>
        <p className="t-muted">Let everything cool, then split it into containers. Eat the fridge ones first.</p>
        {storePlan(R, week.cells, weekStart).map(({ recipe: r, fridge, freezer }) => (
          <section key={r.id} className={styles.card}>
            <div className={styles.dish}>
              <BowlIllustration recipe={r} size={44} decorative />
              <h2 className="t-h3">{r.title}</h2>
            </div>
            <p className="t-small">
              <b>Fridge ({fridge.length}):</b> {fridge.join(", ") || "none"}
            </p>
            {freezer.length > 0 && (
              <p className="t-small">
                <b>Freezer ({freezer.length}):</b> {freezer.join(", ")}. Move each to the fridge the night before.
              </p>
            )}
            {keepApart(r) && <p className="t-small t-muted">{keepApart(r)}</p>}
          </section>
        ))}
        {plan && plan.storeTips.length > 0 && (
          <section className={styles.card}>
            <h2 className="t-h3">Tips</h2>
            {plan.storeTips.map((t) => (
              <p key={t} className="t-small">
                {t}
              </p>
            ))}
          </section>
        )}
      </>
    );
    foot = (
      <>
        <Button block onClick={done}>
          Done cooking
        </Button>
        {steps.length > 0 && (
          <Button variant="secondary" block onClick={() => setI(steps.length - 1)}>
            Back
          </Button>
        )}
      </>
    );
  }

  return (
    <div className={builder.overlay} role="dialog" aria-modal="true" aria-label={`Cook day, ${roundLabel(R, weekStart)}`}>
      <div className={builder.top}>
        <IconButton label="Close" onClick={close}>
          <Icon name="close" size={20} />
        </IconButton>
        <span />
        <span className={`t-label t-muted ${builder.which}`}>Cook day · {roundLabel(R, weekStart)}</span>
      </div>
      <div id="cook-scroll" className={builder.scroll}>
        <div className={builder.body}>{body}</div>
      </div>
      {foot && <div className={builder.foot}>{foot}</div>}
    </div>
  );
}

/** Signed in from the box on cook day: work the order out without another tap, once. */
function WhenSignedIn({ run }: { run: () => void }) {
  const sync = useSync();
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current || !sync.email || sync.status === "loading") return;
    ran.current = true;
    setTimeout(run, 0);
  });
  return null;
}
