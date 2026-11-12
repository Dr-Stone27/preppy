"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { Icon, type IconName } from "@/components/ui/Icon";
import { recipeById } from "@/domain/recipes/library";
import { groupOf, pantryItems, SHOP_ORDER, STOCK_LABEL, stockOf, type Stock } from "@/domain/shop/pantry";
import { setStock, useData } from "@/state/store";
import styles from "./Play.module.css";

const BOWLS = [
  "party-jollof-rice-chicken",
  "nigerian-fried-rice-chicken",
  "efo-riro-beef",
  "egusi-soup-beef",
  "high-protein-beijing-beef-rice-bowls-bjd6",
  "air-fryer-chicken-fajita-bowls",
  "crispy-fried-chicken-9jni",
  "chilli-garlic-chicken-bites-with-cucumber-yogurt-sauce-2bzm",
];

/** Scratch page: three design directions side by side, nothing here is wired into the real screens. */
export function Play() {
  return (
    <div className={styles.page}>
      <header>
        <p className="t-eyebrow">Scratch page</p>
        <h1 className="t-h1">Play</h1>
      </header>
      <Bowls />
      <Pantry />
      <CookStep />
    </div>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className="t-h2">{title}</h2>
      <p className="t-small t-muted">{note}</p>
      {children}
    </section>
  );
}

/* ---------- 1. Bowls ---------- */

function Bowls() {
  const recipes = BOWLS.map(recipeById).filter((r) => r !== undefined);
  return (
    <Section title="1 · Bowls" note="Left: today. Right: inked, with an outline on every piece and a shadow under it. Small bowls are the size used in lists.">
      <div className={styles.bowlHead}>
        <span className="t-label t-muted">Today</span>
        <span className="t-label t-muted">Inked</span>
      </div>
      {recipes.map((r) => (
        <div key={r.id} className={styles.bowlRow}>
          <div className={styles.bowlPair}>
            <BowlIllustration recipe={r} size={120} decorative />
            <BowlIllustration recipe={r} size={40} decorative />
          </div>
          <div className={styles.bowlPair}>
            <BowlIllustration recipe={r} size={120} look="inked" decorative />
            <BowlIllustration recipe={r} size={40} look="inked" decorative />
          </div>
          <p className={`t-label ${styles.bowlName}`}>{r.title}</p>
        </div>
      ))}
    </Section>
  );
}

/* ---------- 2. Pantry tiles ---------- */

/** How a pantry item is kept, which is what its tile shows. */
function iconFor(name: string, group: string): IconName {
  const n = name.toLowerCase();
  if (/cube/.test(n)) return "cube";
  if (/paste|evaporated|condensed|broth/.test(n)) return "tin";
  if (/butter|honey|peanut butter|mayonnaise|mustard|gochujang/.test(n)) return "pot";
  if (/bay leaf|thyme|oregano|parsley|rosemary/.test(n)) return "produce";
  if (/oil|spray/.test(n)) return "oil";
  if (group === "Sauces" || /juice|extract/.test(n)) return "sauces";
  if (group === "Spices") return "spices";
  if (group === "Carbs" || group === "Baking" || group === "Protein" || /egusi|nuts|peanuts|makhana|powder/.test(n)) return "bag";
  return "other";
}

const LEVELS: Stock[] = ["have", "low", "out"];
const LEVEL_ICON = { have: "jarFull", low: "jarLow", out: "jarEmpty" } as const;

function Pantry() {
  const data = useData();
  const [mode, setMode] = useState<"pick" | "cycle">("pick");
  const [open, setOpen] = useState<string | null>(null);
  if (!data) return null;
  const items = pantryItems().filter((p) => !p.fresh);
  const openItem = items.find((p) => p.id === open);

  const tap = (id: string) => {
    if (mode === "pick") return setOpen(id);
    const s = stockOf(data.pantry, id);
    setStock(id, LEVELS[(LEVELS.indexOf(s) + 1) % 3]);
  };

  return (
    <Section title="2 · At home as tiles" note="Each item is a tile and its colour is the level: green have, gold low, red out. Try both ways of changing it.">
      <div className={styles.modes} role="radiogroup" aria-label="What a tap does">
        <button type="button" role="radio" aria-checked={mode === "pick"} onClick={() => setMode("pick")}>
          Tap to choose
        </button>
        <button type="button" role="radio" aria-checked={mode === "cycle"} onClick={() => setMode("cycle")}>
          Tap to cycle
        </button>
      </div>

      {SHOP_ORDER.filter((g) => items.some((p) => groupOf(p.group) === g)).map((g) => (
        <div key={g} className={styles.tileGroup}>
          <h3 className="t-label t-muted">{g}</h3>
          <div className={styles.tiles}>
            {items
              .filter((p) => groupOf(p.group) === g)
              .slice(0, 9)
              .map((p) => {
                const s = stockOf(data.pantry, p.id);
                return (
                  <button key={p.id} type="button" className={`${styles.tile} ${styles[s]}`} onClick={() => tap(p.id)} aria-label={`${p.name}: ${STOCK_LABEL[s]}`}>
                    <Icon name={iconFor(p.name, p.group)} size={30} strokeWidth={1.6} />
                    <span className={styles.tileName}>{p.name}</span>
                    <span className={styles.tileState}>{STOCK_LABEL[s]}</span>
                  </button>
                );
              })}
          </div>
        </div>
      ))}

      {openItem && (
        <div className={styles.sheetBack} onClick={() => setOpen(null)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={openItem.name}>
            <p className="t-h3">{openItem.name}</p>
            <div className={styles.sheetLevels}>
              {LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`${styles.sheetLevel} ${stockOf(data.pantry, openItem.id) === l ? styles[l] : ""}`}
                  onClick={() => {
                    setStock(openItem.id, l);
                    setOpen(null);
                  }}
                >
                  <Icon name={LEVEL_ICON[l]} size={32} />
                  {STOCK_LABEL[l]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

/* ---------- 3. Cook step ---------- */

// Times, heat and amounts: the words you glance at from the stove.
const KEY_WORDS = /(\d+(?:[–-]\d+)?\s*(?:minutes?|mins?|hours?|seconds?)|(?:low|medium|high)(?:-(?:low|high))? heat|\d+\s*°[CF]|\d+(?:\.\d+)?\s*(?:g|kg|ml|cups?|tbsp|tsp)\b|\b(?:a|half a|\d+) cup\b)/gi;

function tint(text: string) {
  return text.split(KEY_WORDS).map((part, i) => (i % 2 ? <mark key={i} className={styles.key}>{part}</mark> : part));
}

function useCountdown(start: number) {
  const [left, setLeft] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : start)), 1000);
    return () => clearInterval(t);
  }, [start]);
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
}

function CookStep() {
  const jollof = recipeById("party-jollof-rice-chicken");
  const stew = recipeById("nigerian-chicken-stew");
  const [step, setStep] = useState(3);
  const jollofTime = useCountdown(27 * 60 + 40);
  const stewTime = useCountdown(8 * 60 + 5);
  if (!jollof) return null;
  const steps = jollof.steps;
  const total = steps.length;

  return (
    <Section title="3 · Cook day step" note="One big step, the words that matter tinted, and every running timer kept on screen as a pill.">
      <div className={styles.cook}>
        <div className={styles.pills}>
          <span className={styles.pill}>
            {stew && <BowlIllustration recipe={stew} size={24} decorative />}
            Stew · {stewTime}
          </span>
          <span className={`${styles.pill} ${styles.pillSoon}`}>
            <BowlIllustration recipe={jollof} size={24} decorative />
            Jollof · {jollofTime}
          </span>
        </div>
        <div className={styles.cookTop}>
          <span className="t-label t-muted">
            {step + 1} of {total}
          </span>
          <span className={styles.cookDish}>
            <BowlIllustration recipe={jollof} size={28} decorative /> Party Jollof
          </span>
        </div>
        <div className={styles.progress} aria-hidden>
          <span style={{ width: `${((step + 1) / total) * 100}%` }} />
        </div>
        <p className={styles.stepText}>{tint(steps[step])}</p>
        <div className={styles.cookNav}>
          <button type="button" className={styles.back} onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} aria-label="Previous step">
            <Icon name="back" size={22} />
          </button>
          <button type="button" className={styles.next} onClick={() => setStep((s) => (s + 1) % total)} aria-label="Next step">
            <Icon name="chevron" size={26} />
          </button>
        </div>
      </div>
    </Section>
  );
}
