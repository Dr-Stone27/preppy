"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { deleteAccount, signOut, useSync } from "@/state/sync";
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
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);
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
        {confirm ? (
          <div className={styles.danger} role="alertdialog" aria-label="Delete account">
            <p className="t-small">
              Delete your account and everything saved to it: plans, pantry, settings and recipes you saved. This can’t be undone.
            </p>
            {failed && <p className={styles.failed}>That didn’t work. Check your connection and try again.</p>}
            <div className={styles.dangerActions}>
              <Button
                size="sm"
                variant="danger"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  setFailed(false);
                  try {
                    await deleteAccount();
                    router.replace("/start");
                  } catch {
                    setFailed(true);
                    setDeleting(false);
                  }
                }}
              >
                {deleting ? "Deleting…" : "Delete everything"}
              </Button>
              <Button size="sm" variant="text" disabled={deleting} onClick={() => setConfirm(false)}>
                Keep my account
              </Button>
            </div>
          </div>
        ) : (
          <button type="button" className={styles.deleteLink} onClick={() => setConfirm(true)}>
            Delete my account
          </button>
        )}
      </section>
    );
  }

  return (
    <section className={styles.card} aria-label="Account">
      <div className={styles.row}>
        <Avatar size={56} />
        <div className={styles.text}>
          <p className={styles.name}>Not signed in</p>
          <p className="t-label t-muted">Your plans are saved in this browser only, so clearing it or changing phone loses them. Sign in to keep them on every device and to read recipes from posts.</p>
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
