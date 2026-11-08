"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { updatePrefs, useData } from "@/state/store";
import styles from "./HomeWeek.module.css";

/** Sends a first-time visitor to setup, then shows three first steps until they're done or hidden. */
export function GettingStarted() {
  const data = useData();
  const router = useRouter();
  const firstRun = data && !data.prefs.onboarded;

  useEffect(() => {
    if (firstRun) router.replace("/welcome");
  }, [firstRun, router]);

  if (!data || firstRun || data.prefs.checklistHidden) return null;

  const items = [
    { label: "Save a recipe", done: data.recipes.length > 0, href: "/add" },
    { label: "Plan a round", done: Object.values(data.weeks).some((w) => w.rounds.some((r) => r.confirmed)), href: "/plan" },
    { label: "Do your first stock-up", done: Object.values(data.pantry).some((s) => s === "have"), href: "/shop?view=stock" },
  ];
  if (items.every((i) => i.done)) return null;

  return (
    <section className={styles.today} aria-label="Getting started">
      <div className={styles.todayHead}>
        <h2 className="t-h3">Getting started</h2>
        <button type="button" className={styles.hide} onClick={() => updatePrefs((p) => ({ ...p, checklistHidden: true }))}>
          Hide
        </button>
      </div>
      <ul className={styles.meals}>
        {items.map((i) => (
          <li key={i.label}>
            <Link href={i.href} className={styles.meal}>
              <span className={styles.step} data-done={i.done || undefined} aria-hidden>
                {i.done && <Icon name="check" size={16} strokeWidth={2.4} />}
              </span>
              <span className={styles.mealText}>
                <span className={i.done ? `${styles.mealTitle} ${styles.struck}` : styles.mealTitle}>{i.label}</span>
              </span>
              <Icon name="chevron" size={18} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
