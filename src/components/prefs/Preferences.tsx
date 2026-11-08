"use client";

import Link from "next/link";
import { AccountPanel } from "@/components/account/AccountPanel";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { updatePrefs, useData } from "@/state/store";
import { useSync } from "@/state/sync";
import { NeverEditor, SidesEditor } from "./PrefEditors";
import styles from "./Preferences.module.css";

export function Preferences() {
  const data = useData();
  const sync = useSync();
  if (!data) return <div style={{ minHeight: "60vh" }} aria-busy="true" />;

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.back}>
        <Icon name="back" size={20} />
        Home
      </Link>
      <h1 className="t-h1">Preferences</h1>

      <section className={styles.section} id="account">
        <div>
          <h2 className="t-h3">Account</h2>
          {!sync.email && sync.status !== "off" && (
            <p className="t-small t-muted">Sign in to keep your plans, pantry and saved recipes on every device. We’ll email you a code.</p>
          )}
        </div>
        <AccountPanel />
      </section>

      <section className={styles.section}>
        <div>
          <h2 className="t-h3">Never in my food</h2>
          <p className="t-small t-muted">Recipes with these get a warning.</p>
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
