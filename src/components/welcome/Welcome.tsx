"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { BowlCollage } from "@/components/bowl/BowlCollage";
import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { NeverEditor, SidesEditor } from "@/components/prefs/PrefEditors";
import { Button, IconButton } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { recipeById, starterRecipes } from "@/domain/recipes/library";
import { ruleWarnings } from "@/domain/recipes/rules";
import { addStarters, updatePrefs, useData } from "@/state/store";
import builder from "@/components/plan/RoundBuilder.module.css";
import styles from "./Welcome.module.css";

const STEPS = 4;
const HOW = [
  { title: "Cook twice, eat all week", body: "Sunday’s cook covers Sunday to Wednesday. Wednesday’s covers Thursday to Saturday." },
  { title: "Keep it interesting", body: "Pick two or three mains per round. Preppy tells you when two taste the same." },
  { title: "One cooking session", body: "Cook day puts every dish in one order, then tells you what goes in the fridge and what goes in the freezer." },
];

export function Welcome() {
  const data = useData();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    document.getElementById("welcome-scroll")?.scrollTo(0, 0);
  }, [step]);

  if (!data) return <div style={{ minHeight: "60vh" }} aria-busy="true" />;

  const finish = (to: string) => {
    updatePrefs((p) => ({ ...p, onboarded: true }));
    router.replace(to);
  };

  const starters = starterRecipes();
  let body: ReactNode;
  let foot: ReactNode;

  if (step === 0) {
    body = (
      <>
        <div className={builder.hero}>
          <BowlCollage recipes={["party-jollof-rice-chicken", "efo-riro-beef", "banana-bread-loaf"].map(recipeById).filter((r) => r !== undefined)} size={92} />
        </div>
        <h1 className="t-display">Meal prep, planned for you</h1>
        <p className="t-muted">Save recipes, plan the week in two cooks, and shop from one list.</p>
        <ul className={styles.how}>
          {HOW.map((h, i) => (
            <li key={h.title}>
              <span className={styles.num}>{i + 1}</span>
              <span>
                <span className={styles.howTitle}>{h.title}</span>
                <span className="t-small t-muted">{h.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </>
    );
    foot = (
      <Button block onClick={() => setStep(1)}>
        Set up in a minute
      </Button>
    );
  } else if (step === 1) {
    body = (
      <>
        <div className={builder.intro}>
          <h1 className="t-h1">Anything you don’t eat?</h1>
          <p className="t-muted">Recipes with these get a warning, so you can skip or swap them.</p>
        </div>
        <NeverEditor never={data.prefs.never} onChange={(never) => updatePrefs((p) => ({ ...p, never }))} />
      </>
    );
  } else if (step === 2) {
    body = (
      <>
        <div className={builder.intro}>
          <h1 className="t-h1">Your sides</h1>
          <p className="t-muted">Mains without their own carb get one of these, taking turns through the week.</p>
        </div>
        <SidesEditor bases={data.prefs.bases} onChange={(bases) => updatePrefs((p) => ({ ...p, bases }))} />
      </>
    );
  } else if (step === 3) {
    body = (
      <>
        <div className={builder.intro}>
          <h1 className="t-h1">Start with a few recipes</h1>
          <p className="t-muted">Pick any you’d cook. You can add your own from Instagram later.</p>
        </div>
        <div className={builder.grid}>
          {starters.map((r) => {
            const on = picked.includes(r.id);
            const { items } = ruleWarnings(r, data.prefs.never);
            return (
              <button
                key={r.id}
                type="button"
                className={builder.pick}
                aria-pressed={on}
                onClick={() => setPicked((p) => (p.includes(r.id) ? p.filter((x) => x !== r.id) : [...p, r.id]))}
              >
                {on && (
                  <span className={builder.tick} aria-hidden>
                    <Icon name="check" size={16} strokeWidth={2.4} />
                  </span>
                )}
                <BowlIllustration recipe={r} size={84} decorative />
                <span className={builder.pickTitle}>{r.title}</span>
                <span className={builder.pickMeta}>
                  <Tag tone={r.kind === "sweet" ? "neutral" : "accent"}>{r.kind === "sweet" ? "Breakfast" : r.flavour ?? "Main"}</Tag>
                </span>
                {items.length > 0 && <span className={builder.pickWarn}>Has {items.join(", ")}</span>}
              </button>
            );
          })}
        </div>
      </>
    );
    foot = picked.length ? (
      <Button
        block
        onClick={() => {
          addStarters(picked.map(recipeById).filter((r) => r !== undefined));
          setStep(4);
        }}
      >
        Add {picked.length} {picked.length === 1 ? "recipe" : "recipes"}
      </Button>
    ) : (
      <Button block variant="secondary" onClick={() => setStep(4)}>
        Skip for now
      </Button>
    );
  } else {
    body = (
      <div className={builder.done}>
        <div className={builder.hero}>
          <BowlCollage recipes={picked.map(recipeById).filter((r) => r !== undefined)} size={84} />
        </div>
        <h1 className="t-h1">You’re set</h1>
        <p className="t-muted">Next, plan your first round. You can change any of this in Preferences.</p>
      </div>
    );
    foot = (
      <>
        <Button block onClick={() => finish("/plan")}>
          Plan your first round
        </Button>
        <Button variant="secondary" block onClick={() => finish("/")}>
          Go home
        </Button>
      </>
    );
  }

  if (step === 1 || step === 2)
    foot = (
      <Button block onClick={() => setStep(step + 1)}>
        Next
      </Button>
    );

  return (
    <div className={builder.overlay} role="dialog" aria-modal="true" aria-label="Set up Preppy">
      <div className={builder.top}>
        {step > 0 && step < 4 ? (
          <IconButton label="Back" onClick={() => setStep(step - 1)}>
            <Icon name="back" size={20} />
          </IconButton>
        ) : (
          <span />
        )}
        {step > 0 && step < 4 ? (
          <span className={builder.progress} aria-label={`Step ${step} of ${STEPS - 1}`}>
            {[1, 2, 3].map((n) => (
              <i key={n} data-on={n <= step || undefined} />
            ))}
          </span>
        ) : (
          <span />
        )}
        {step < 4 ? (
          <button type="button" className={styles.skip} onClick={() => finish("/")}>
            Skip
          </button>
        ) : (
          <span />
        )}
      </div>
      <div id="welcome-scroll" className={builder.scroll}>
        <div className={builder.body}>{body}</div>
      </div>
      <div className={builder.foot}>{foot}</div>
    </div>
  );
}
