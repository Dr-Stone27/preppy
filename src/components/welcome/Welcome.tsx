"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { BowlCollage } from "@/components/bowl/BowlCollage";
import { NeverEditor, SidesEditor } from "@/components/prefs/PrefEditors";
import { Button, IconButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { libraryRecipes, recipeById } from "@/domain/recipes/library";
import { updatePrefs, useData } from "@/state/store";
import { markSeen, setSetupPending, useSync } from "@/state/sync";
import { AccountPanel } from "@/components/account/AccountPanel";
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
  // Arriving from the emailed link partway through setup lands on the last step. Nothing renders until data loads, so this can't mismatch.
  const [step, setStep] = useState(() => (typeof window !== "undefined" && new URLSearchParams(location.search).get("step") === "done" ? 4 : 0));
  const sync = useSync();

  useEffect(() => {
    document.getElementById("welcome-scroll")?.scrollTo(0, 0);
    // From here, tapping the emailed link should bring them back to finish setup, not start over.
    if (step === 3) setSetupPending(true);
  }, [step]);

  if (!data) return <div style={{ minHeight: "60vh" }} aria-busy="true" />;

  const finish = (to: string) => {
    updatePrefs((p) => ({ ...p, onboarded: true }));
    setSetupPending(false);
    markSeen();
    router.replace(to);
  };

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
      <>
        <Button block onClick={() => setStep(1)}>
          Set up in a minute
        </Button>
        {sync.status !== "off" && !sync.email && (
          <p className={styles.already}>
            Already use Preppy? <Link href="/account">Sign in</Link>
          </p>
        )}
      </>
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
          <h1 className="t-h1">{sync.email ? "You’re signed in" : "Keep your plans safe"}</h1>
          <p className="t-muted">
            {sync.email
              ? "Your plans, pantry and saved recipes will follow you to any device."
              : "Sign in and your plans, pantry and saved recipes follow you to any device. You’ll also need it to read recipes from Instagram posts."}
          </p>
        </div>
        <AccountPanel />
      </>
    );
    foot =
      sync.email || sync.status === "off" ? (
        <Button block onClick={() => setStep(4)}>
          Next
        </Button>
      ) : (
        <Button block variant="secondary" onClick={() => setStep(4)}>
          Not now
        </Button>
      );
  } else {
    body = (
      <div className={builder.done}>
        <div className={builder.hero}>
          <BowlCollage recipes={["suya-jollof-rice-with-beef-suya-npq6", "korean-sweet-chili-minced-beef", "vanilla-caramel-flan-cup"].map(recipeById).filter((r) => r !== undefined)} size={84} />
        </div>
        <h1 className="t-h1">You’re set</h1>
        <p className="t-muted">The library has {libraryRecipes().length} dishes to plan with. You can change any of this in Settings.</p>
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
