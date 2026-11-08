"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { BowlCollage } from "@/components/bowl/BowlCollage";
import { CookDaysEditor, NeverEditor, SidesEditor } from "@/components/prefs/PrefEditors";
import { Button, IconButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { libraryRecipes, recipeById } from "@/domain/recipes/library";
import { updatePrefs, useData } from "@/state/store";
import { markSeen, setSetupPending, useSync } from "@/state/sync";
import { AccountPanel } from "@/components/account/AccountPanel";
import builder from "@/components/plan/RoundBuilder.module.css";
import styles from "./Welcome.module.css";

// Steps in order. The progress dots cover the four questions between the intro and the end.
const COOK = 1, NEVER = 2, SIDES = 3, SIGN_IN = 4, DONE = 5;
const HOW = [
  { title: "Cook a few times, eat all week", body: "Pick the days you cook. Each cook covers the days until the next one." },
  { title: "Keep it interesting", body: "Pick two or three mains per round. Preppy tells you when two taste the same." },
  { title: "One cooking session", body: "Cook day puts every dish in one order, then tells you what goes in the fridge and what goes in the freezer." },
];

export function Welcome() {
  const data = useData();
  const router = useRouter();
  // Arriving from the emailed link partway through setup lands on the last step. Nothing renders until data loads, so this can't mismatch.
  const [step, setStep] = useState(() => (typeof window !== "undefined" && new URLSearchParams(location.search).get("step") === "done" ? DONE : 0));
  const sync = useSync();

  useEffect(() => {
    document.getElementById("welcome-scroll")?.scrollTo(0, 0);
    // From here, tapping the emailed link should bring them back to finish setup, not start over.
    if (step === SIGN_IN) setSetupPending(true);
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
        <p className="t-muted">Save recipes, plan the week around the days you cook, and shop from one list.</p>
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
        <Button block onClick={() => setStep(COOK)}>
          Set up in a minute
        </Button>
        {sync.status !== "off" && !sync.email && (
          <p className={styles.already}>
            Already use Preppy? <Link href="/account">Sign in</Link>
          </p>
        )}
      </>
    );
  } else if (step === COOK) {
    body = (
      <>
        <div className={builder.intro}>
          <h1 className="t-h1">When do you cook?</h1>
          <p className="t-muted">Pick the days you batch-cook, up to three. You can change them in Settings.</p>
        </div>
        <CookDaysEditor days={data.prefs.cookDays ?? []} onChange={(cookDays) => updatePrefs((p) => ({ ...p, cookDays }))} />
      </>
    );
    foot = (
      <Button block disabled={!data.prefs.cookDays?.length} onClick={() => setStep(NEVER)}>
        Next
      </Button>
    );
  } else if (step === NEVER) {
    body = (
      <>
        <div className={builder.intro}>
          <h1 className="t-h1">Anything you don’t eat?</h1>
          <p className="t-muted">Pick any you avoid. Recipes with them get a warning, so you can skip or swap them. Nothing to avoid? Tap Next.</p>
        </div>
        <NeverEditor never={data.prefs.never} onChange={(never) => updatePrefs((p) => ({ ...p, never }))} />
      </>
    );
  } else if (step === SIDES) {
    body = (
      <>
        <div className={builder.intro}>
          <h1 className="t-h1">Your sides</h1>
          <p className="t-muted">Pick the sides you like. Mains without their own carb get one of these, taking turns through the week.</p>
        </div>
        <SidesEditor bases={data.prefs.bases} onChange={(bases) => updatePrefs((p) => ({ ...p, bases }))} />
      </>
    );
  } else if (step === SIGN_IN) {
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
        <Button block onClick={() => setStep(DONE)}>
          Next
        </Button>
      ) : (
        <Button block variant="secondary" onClick={() => setStep(DONE)}>
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

  if (step === NEVER || step === SIDES)
    foot = (
      <Button block onClick={() => setStep(step + 1)}>
        Next
      </Button>
    );

  return (
    <div className={builder.overlay} role="dialog" aria-modal="true" aria-label="Set up Preppy">
      <div className={builder.top}>
        {step > 0 && step < DONE ? (
          <IconButton label="Back" onClick={() => setStep(step - 1)}>
            <Icon name="back" size={20} />
          </IconButton>
        ) : (
          <span />
        )}
        {step > 0 && step < DONE ? (
          <span className={builder.progress} aria-label={`Step ${step} of ${DONE - 1}`}>
            {[COOK, NEVER, SIDES, SIGN_IN].map((n) => (
              <i key={n} data-on={n <= step || undefined} />
            ))}
          </span>
        ) : (
          <span />
        )}
        {step < DONE ? (
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
