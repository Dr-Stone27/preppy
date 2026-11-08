"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { updatePrefs, useData } from "@/state/store";
import { hasSeen, markSeen, useSync } from "@/state/sync";
import styles from "./HomeWeek.module.css";

/**
 * Sends a first-time visitor to setup and a signed-out returning one to sign in, then shows first steps until done or hidden.
 * A signed-in person is never sent to setup; they get a "set what you don't eat" step instead.
 */
export function GettingStarted() {
  const data = useData();
  const router = useRouter();
  const sync = useSync();
  // A signed-in user on a new device gets their setup from the account, so wait for it.
  const ready = !!data && sync.status !== "loading";
  const away = ready && !data.prefs.onboarded && !sync.email;
  const goTo = !away ? null : sync.status !== "off" && hasSeen() ? "/account" : "/welcome";

  useEffect(() => {
    if (goTo) router.replace(goTo);
    else if (data?.prefs.onboarded) markSeen(); // browsers set up before this flag existed
  }, [goTo, data?.prefs.onboarded, router]);

  if (!data || !ready || goTo || data.prefs.checklistHidden) return null;

  const items = [
    ...(data.prefs.onboarded ? [] : [{ label: "Set what you don’t eat", done: false, href: "/settings" }]),
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
