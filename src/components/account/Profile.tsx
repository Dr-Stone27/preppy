"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { signOut, useSync } from "@/state/sync";
import { AccountPanel } from "./AccountPanel";
import { Avatar } from "./Avatar";
import styles from "./Profile.module.css";

const STATUS: Record<string, string> = {
  saved: "Plans saved to your account",
  saving: "Saving…",
  offline: "Not saved yet. We’ll try again when you’re online.",
  loading: "Loading your plans…",
};

/** Top of Settings: who's signed in, and sign in or out. */
export function Profile() {
  const sync = useSync();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const router = useRouter();

  if (sync.status === "off") return null;

  if (sync.email) {
    return (
      <section className={styles.card} aria-label="Account">
        <div className={styles.row}>
          <Avatar size={56} />
          <div className={styles.text}>
            <p className={styles.name}>{sync.email}</p>
            <p className="t-label t-muted" role="status">
              {STATUS[sync.status] ?? ""}
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={leaving}
          onClick={async () => {
            setLeaving(true);
            await signOut();
            setLeaving(false);
            router.replace("/account");
          }}
        >
          {leaving ? "Signing out…" : "Sign out"}
        </Button>
      </section>
    );
  }

  return (
    <section className={styles.card} aria-label="Account">
      <div className={styles.row}>
        <Avatar size={56} />
        <div className={styles.text}>
          <p className={styles.name}>Not signed in</p>
          <p className="t-label t-muted">Sign in to keep your plans on every device and read recipes from posts.</p>
        </div>
      </div>
      {open ? (
        <AccountPanel />
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          Sign in
        </Button>
      )}
    </section>
  );
}
