"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/Icon";
import { forgetSeen, hasSeen, useSync } from "@/state/sync";
import { AccountPanel } from "./AccountPanel";
import form from "@/components/add/Add.module.css";
import prefs from "@/components/prefs/Preferences.module.css";

const noop = () => () => {};

/** Where the emailed sign-in link lands, where sign-out lands, and where "sign in" prompts point. */
export function Account() {
  const sync = useSync();
  const router = useRouter();
  const back = useSyncExternalStore(noop, hasSeen, () => false);

  const signedOut = !sync.email && sync.status !== "loading";

  return (
    <div className={prefs.page}>
      <Link href="/" className={prefs.back}>
        <Icon name="back" size={20} />
        Home
      </Link>
      <h1 className="t-h1">{sync.email ? "Your account" : back ? "Welcome back" : "Sign in"}</h1>
      <section className={prefs.section}>
        <div>
          <h2 className="t-h3">{sync.email ? "Signed in" : back ? "Sign in to get your plans back" : "Keep your plans on every device"}</h2>
          {!sync.email && <p className="t-small t-muted">We’ll email you a sign-in link. No password needed.</p>}
        </div>
        <AccountPanel />
      </section>
      {signedOut && back && (
        <button
          type="button"
          className={form.link}
          onClick={() => {
            forgetSeen();
            router.push("/welcome");
          }}
        >
          New here? Start fresh without an account
        </button>
      )}
    </div>
  );
}
