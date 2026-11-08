"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useSync } from "@/state/sync";
import { AccountPanel } from "./AccountPanel";
import prefs from "@/components/prefs/Preferences.module.css";

/** Where the emailed sign-in link lands, and where "sign in" prompts point. */
export function Account() {
  const sync = useSync();
  return (
    <div className={prefs.page}>
      <Link href="/" className={prefs.back}>
        <Icon name="back" size={20} />
        Home
      </Link>
      <h1 className="t-h1">{sync.email ? "Your account" : "Sign in"}</h1>
      <section className={prefs.section}>
        <div>
          <h2 className="t-h3">{sync.email ? "Signed in" : "Keep your plans on every device"}</h2>
          {!sync.email && <p className="t-small t-muted">We’ll email you a sign-in link. No password needed.</p>}
        </div>
        <AccountPanel />
      </section>
    </div>
  );
}
