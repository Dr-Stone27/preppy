"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useRef } from "react";
import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { Icon } from "@/components/ui/Icon";
import { cuisineOf } from "@/domain/bowl/fromRecipe";
import { libraryRecipes, recipeById } from "@/domain/recipes/library";
import type { Recipe } from "@/domain/recipes/types";
import { track } from "@/lib/analytics";
import styles from "./Landing.module.css";

const HERO = "party-jollof-rice-chicken";
const ORBIT = ["korean-sweet-chili-minced-beef", "vanilla-caramel-flan-cup"];

/** One dish per cuisine, so the scrolling shelf shows the range rather than six jollofs. */
function shelf(): Recipe[] {
  const seen = new Set<string>();
  const picks: Recipe[] = [];
  for (const r of libraryRecipes()) {
    const c = cuisineOf(r);
    if (seen.has(c)) continue;
    seen.add(c);
    picks.push(r);
  }
  for (const r of libraryRecipes()) if (picks.length < 9 && !picks.includes(r)) picks.push(r);
  return picks.slice(0, 9);
}

const WEEK = [
  { d: "Tue", round: 1, cook: true },
  { d: "Wed", round: 1 },
  { d: "Thu", round: 1 },
  { d: "Fri", round: 2, cook: true },
  { d: "Sat", round: 2 },
  { d: "Sun", round: 2 },
  { d: "Mon", round: 2 },
];

const LIST = [
  { name: "Chicken thighs", amount: "1.2 kg" },
  { name: "Plantain", amount: "6" },
  { name: "Scotch bonnet", amount: "4" },
  { name: "Spring onions", amount: "1 bunch" },
];

const STEPS = [
  { title: "Start the rice", where: "Stove · 25 min" },
  { title: "Meanwhile, marinate the chicken", where: "Prep" },
  { title: "Chicken into the oven", where: "Oven · 35 min" },
];

/** Adds data-in to each [data-reveal] element as it scrolls into view. */
function useReveal(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = el.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      items.forEach((i) => i.setAttribute("data-in", ""));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.setAttribute("data-in", "");
            io.unobserve(e.target);
          }
      },
      { root: el, threshold: 0.2 },
    );
    items.forEach((i) => io.observe(i));
    return () => io.disconnect();
  }, [root]);
}

function Feature({ n, title, body, children }: { n: number; title: string; body: ReactNode; children: ReactNode }) {
  return (
    <article className={styles.feature} data-reveal style={{ "--i": n } as React.CSSProperties}>
      <div className={styles.demo} aria-hidden>
        {children}
      </div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureBody}>{body}</p>
    </article>
  );
}

function Steam() {
  return (
    <svg className={styles.steam} viewBox="0 0 120 90" aria-hidden>
      {["M30 85c-10-14 10-22 0-38s8-24 2-40", "M60 85c-10-14 10-22 0-38s8-24 2-40", "M90 85c-10-14 10-22 0-38s8-24 2-40"].map((d, i) => (
        <path key={i} d={d} style={{ animationDelay: `${i * 0.9}s` }} />
      ))}
    </svg>
  );
}

/** The page someone sees first from a shared link: what Preppy is, then setup or sign-in. */
export function Landing() {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  useEffect(() => track("landing_viewed"), []);

  const hero = recipeById(HERO);
  const orbit = ORBIT.map(recipeById).filter((r): r is Recipe => !!r);
  const dishes = shelf();
  const count = libraryRecipes().length;

  const start = (
    <Link href="/welcome?step=start" className={styles.cta} onClick={() => track("landing_get_started")}>
      Get started
      <Icon name="chevron" size={18} strokeWidth={2.4} />
    </Link>
  );

  return (
    <div ref={root} className={styles.page}>
      <header className={styles.top}>
        <span className={styles.brand}>
          {hero && <BowlIllustration recipe={hero} size={28} decorative />}
          Preppy
        </span>
        <Link href="/account" className={styles.signIn}>
          Sign in
        </Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.art} aria-hidden>
          <span className={`${styles.dot} ${styles.dot1}`} />
          <span className={`${styles.dot} ${styles.dot2}`} />
          <span className={`${styles.leaf} ${styles.leaf1}`} />
          <span className={`${styles.leaf} ${styles.leaf2}`} />
          <Steam />
          <div className={styles.spin}>{hero && <BowlIllustration recipe={hero} size={220} decorative />}</div>
          {orbit.map((r, i) => (
            <div key={r.id} className={`${styles.orbit} ${styles[`orbit${i + 1}`]}`}>
              <BowlIllustration recipe={r} size={84} decorative />
            </div>
          ))}
        </div>

        <h1 className={styles.title}>
          Cook a few times.{" "}
          <span className={styles.underline}>
            Eat well all week.
            <svg viewBox="0 0 300 16" preserveAspectRatio="none" aria-hidden>
              <path d="M4 11c50-8 110-9 160-5s90 4 132-3" />
            </svg>
          </span>
        </h1>
        <p className={styles.lede}>Preppy plans your meal prep around the days you cook, builds your shopping list, and tells you what to cook first.</p>
        <div className={styles.actions}>
          {start}
          <p className={styles.already}>
            Already use Preppy? <Link href="/account">Sign in</Link>
          </p>
        </div>
      </section>

      <section className={styles.features} aria-label="What Preppy does">
        <Feature n={0} title="Plan around your days" body="Pick when you cook. Each cook covers the days until the next one, and every meal gets a slot.">
          <div className={styles.week}>
            {WEEK.map((w, i) => (
              <span key={w.d} className={styles.dayPill} data-round={w.round} style={{ "--d": i } as React.CSSProperties}>
                <small>{w.d}</small>
                {w.cook ? <Icon name="flame" size={16} strokeWidth={2} /> : <i />}
              </span>
            ))}
          </div>
        </Feature>

        <Feature
          n={1}
          title="A library to start from"
          body={
            <>
              {count} dishes, from jollof and efo riro to Korean and Chinese favourites. Save your own from Instagram: share a post to Preppy, or paste its caption.
            </>
          }
        >
          <div className={styles.shelf}>
            <div className={styles.shelfTrack}>
              {[...dishes, ...dishes].map((r, i) => (
                <BowlIllustration key={`${r.id}-${i}`} recipe={r} size={64} decorative />
              ))}
            </div>
          </div>
        </Feature>

        <Feature n={2} title="One list, no guessing" body="Everything the plan needs, grouped by where you buy it, minus what’s already at home.">
          <ul className={styles.list}>
            {LIST.map((l, i) => (
              <li key={l.name} style={{ "--t": i } as React.CSSProperties}>
                <span className={styles.box}>
                  <Icon name="check" size={13} strokeWidth={3} />
                </span>
                <span className={styles.item}>{l.name}</span>
                <span className={styles.amount}>{l.amount}</span>
              </li>
            ))}
          </ul>
        </Feature>

        <Feature n={3} title="Cook day, sorted" body="All your dishes in one order, then what goes in the fridge and what goes in the freezer.">
          <ol className={styles.steps}>
            {STEPS.map((s, i) => (
              <li key={s.title} style={{ "--t": i } as React.CSSProperties}>
                <span className={styles.stepDot} />
                <span>
                  <b>{s.title}</b>
                  <small>{s.where}</small>
                </span>
              </li>
            ))}
          </ol>
          <div className={styles.store}>
            <span className={styles.fridge}>Fridge · next 2 days</span>
            <span className={styles.freezer}>Freezer · the rest</span>
          </div>
        </Feature>
      </section>

      <section className={styles.close} data-reveal>
        <div className={styles.closeArt} aria-hidden>
          <Steam />
          {orbit[0] && <BowlIllustration recipe={orbit[0]} size={96} decorative />}
        </div>
        <h2 className={styles.closeTitle}>Your first week takes a minute to plan.</h2>
        {start}
      </section>

      <footer className={styles.foot}>
        <span>Free while in early testing</span>
        <span aria-hidden>·</span>
        <Link href="/privacy">Privacy</Link>
      </footer>
    </div>
  );
}
