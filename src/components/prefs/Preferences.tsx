"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Profile } from "@/components/account/Profile";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { updatePrefs, useData } from "@/state/store";
import { cookDaysOf, peopleOf } from "@/domain/plan/week";
import { CookDaysEditor, NeverEditor, PeopleEditor, SidesEditor } from "./PrefEditors";
import styles from "./Preferences.module.css";

export function Preferences() {
  const data = useData();
  const unset = data ? !data.prefs.onboarded : false;
  // Opening Settings is where someone who skipped setup sets their food rules, so it counts as set up.
  useEffect(() => {
    if (unset) updatePrefs((p) => ({ ...p, onboarded: true }));
  }, [unset]);
  if (!data) return <div style={{ minHeight: "60vh" }} aria-busy="true" />;

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.back}>
        <Icon name="back" size={20} />
        Home
      </Link>
      <h1 className="t-h1">Settings</h1>

      <Profile />

      <section className={styles.section}>
        <div>
          <h2 className="t-h3">People</h2>
          <p className="t-small t-muted">How many people each meal feeds. Shopping lists and portions are sized for this.</p>
        </div>
        <PeopleEditor people={peopleOf(data.prefs)} onChange={(people) => updatePrefs((p) => ({ ...p, people }))} />
      </section>

      <section className={styles.section}>
        <div>
          <h2 className="t-h3">Cook days</h2>
          <p className="t-small t-muted">New weeks follow these. Weeks you’ve already planned keep their days.</p>
        </div>
        <CookDaysEditor required days={cookDaysOf(data.prefs)} onChange={(cookDays) => updatePrefs((p) => ({ ...p, cookDays }))} />
      </section>

      <section className={styles.section}>
        <div>
          <h2 className="t-h3">Never in my food</h2>
          <p className="t-small t-muted">Dishes with these are flagged wherever you pick or plan them, including cooks already planned.</p>
        </div>
        <NeverEditor never={data.prefs.never} onChange={(never) => updatePrefs((p) => ({ ...p, never }))} />
      </section>

      <section className={styles.section}>
        <div>
          <h2 className="t-h3">Sides</h2>
          <p className="t-small t-muted">Served with mains that don’t include their own carb.</p>
        </div>
        <SidesEditor bases={data.prefs.bases} onChange={(bases) => updatePrefs((p) => ({ ...p, bases }))} />
      </section>

      <section className={styles.section}>
        <div>
          <h2 className="t-h3">Setup</h2>
          <p className="t-small t-muted">Go through the first-run questions again.</p>
        </div>
        <ButtonLink href="/welcome" variant="secondary" size="sm">
          Run setup again
        </ButtonLink>
      </section>
    </div>
  );
}
