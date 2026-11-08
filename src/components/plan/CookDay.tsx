"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { BowlCollage } from "@/components/bowl/BowlCollage";
import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/Layout";
import { cookDishes, fallbackPlan, planFromAi, storePlan } from "@/domain/plan/cook";
import { today0, weekKey, weekStartFromKey } from "@/domain/plan/dates";
import type { RoundId } from "@/domain/plan/types";
import { roundLabel, weekStartFor } from "@/domain/plan/week";
import { allRecipes } from "@/domain/recipes/library";
import { authHeader } from "@/lib/supabase";
import { shopLines } from "@/domain/shop/list";
import { getWeek, updateWeek, useData } from "@/state/store";
import builder from "./RoundBuilder.module.css";
import styles from "./CookDay.module.css";

type Timer = { step: number; end: number };

export function CookDay() {
  const data = useData();
  const params = useSearchParams();
  const router = useRouter();
  const [i, setI] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [timer, setTimer] = useState<Timer | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!timer) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [timer]);

  const left = timer ? Math.max(0, Math.round((timer.end - now) / 1000)) : 0;
  useEffect(() => {
    if (timer && now && left === 0) navigator.vibrate?.([300, 150, 300]);
  }, [timer, now, left]);

  useEffect(() => {
    document.getElementById("cook-scroll")?.scrollTo(0, 0);
  }, [i]);

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
          })),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      savePlan(planFromAi((await res.json()).plan));
    } catch (e) {
      savePlan(fallbackPlan(R, week.cells));
      setNotice(
        (e as Error).message === "503"
          ? "Working out a combined order isn’t switched on yet, so here’s each recipe in turn."
          : (e as Error).message === "401"
            ? "Sign in to get one combined cooking order. For now, here’s each recipe in turn."
            : "Couldn’t work out a combined order just now, so here’s each recipe in turn.",
      );
    } finally {
      setBusy(false);
      setI(0);
    }
  };

  const done = () => {
    updateWeek(key, (w) => {
      w.rounds.find((x) => x.id === R.id)!.cooked = true;
      return w;
    });
    router.push("/plan");
  };

  let body: ReactNode;
  let foot: ReactNode = null;
  const steps = plan?.steps ?? [];

  if (!dishes.length) {
    body = (
      <EmptyState
        title="No mains planned for this round"
        body="Plan the round first, then come back to cook."
        action={
          <ButtonLink href={`/plan?build=${R.id}`} size="sm">
            Plan this round
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
                <span className="t-label t-muted">{portions} portions</span>
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
        <p className="t-small t-muted">Breakfasts and sweets aren’t part of the batch. Make them fresh each day.</p>
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
    const mine = timer?.step === i;
    body = (
      <>
        {notice && <p className={styles.notice}>{notice}</p>}
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
        <h1 className="t-h1">{s.title}</h1>
        <p className={styles.detail}>{s.detail}</p>
        {s.meanwhile && (
          <p className={styles.meanwhile}>
            <b>Meanwhile:</b> {s.meanwhile}
          </p>
        )}
        {s.minutes && (
          <div className={styles.timer}>
            <span className={styles.clock} aria-live="polite">
              {mine ? `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}` : `${s.minutes}:00`}
            </span>
            <span className="t-small t-muted">{mine ? (left ? "Running" : "Time’s up") : `${s.minutes} minute timer`}</span>
            {mine ? (
              <Button variant="secondary" size="sm" onClick={() => setTimer(null)}>
                Stop
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setNow(Date.now());
                  setTimer({ step: i, end: Date.now() + s.minutes! * 60_000 });
                }}
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
    <div className={builder.overlay} role="dialog" aria-modal="true" aria-label={`Cook day, ${roundLabel(R, weekStart).toLowerCase()}`}>
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
