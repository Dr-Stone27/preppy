"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { sendCode, signOut, useSync } from "@/state/sync";
import form from "@/components/add/Add.module.css";
import styles from "./AccountPanel.module.css";

const STATUS: Record<string, string> = {
  saved: "Your plans are saved to your account.",
  saving: "Saving…",
  offline: "Couldn’t save just now. We’ll try again when you’re back online.",
  loading: "Loading your plans…",
};

function message(e: unknown): string {
  const err = e as { code?: string; status?: number; message?: string };
  if (err.code === "email_address_not_authorized") return "We can’t send to that address yet. Preppy is invite-only for now.";
  if (err.code === "over_email_send_rate_limit" || err.code === "over_request_rate_limit" || err.status === 429)
    return "Too many links asked for. Wait a minute, then try again.";
  if (err.code === "otp_expired" || err.code === "invalid_credentials" || /token|otp/i.test(err.message ?? ""))
    return "That link has expired. Send a new one.";
  if (err.code === "email_address_invalid" || /email/i.test(err.message ?? "")) return "Check the email address.";
  return "Something went wrong. Try again.";
}

/** Sign in with an emailed link, and show sync status once signed in. */
export function AccountPanel() {
  const sync = useSync();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (sync.status === "off") return <p className="t-small t-muted">Accounts aren’t switched on yet. Everything stays in this browser.</p>;

  if (sync.email) {
    return (
      <div className={styles.panel}>
        <p className={styles.who}>
          <Icon name="check" size={18} strokeWidth={2.4} />
          <span>
            Signed in as <strong>{sync.email}</strong>
          </span>
        </p>
        <p className="t-small t-muted" role="status">
          {STATUS[sync.status] ?? ""}
        </p>
        <Button variant="secondary" size="sm" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    );
  }

  const run = async (e: FormEvent, fn: () => Promise<void>) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };

  if (!sent) {
    return (
      <form
        className={styles.panel}
        onSubmit={(e) =>
          run(e, async () => {
            await sendCode(email.trim());
            setSent(true);
          })
        }
      >
        <label className={form.field}>
          <span>Email</span>
          <input type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <Button type="submit" block disabled={busy || !email.trim()}>
          {busy ? "Sending…" : "Email me a sign-in link"}
        </Button>
      </form>
    );
  }

  return (
    <div className={styles.panel}>
      <p className="t-small">
        We sent a sign-in link to <strong>{email.trim()}</strong>. Open the email on this device and tap the link. It works once and expires in an hour.
      </p>
      <p className="t-small t-muted">Nothing there? Check spam, or wait a minute and send another.</p>
      <button
        type="button"
        className={form.link}
        onClick={() => {
          setSent(false);
          setError("");
        }}
      >
        Use a different email or send again
      </button>
    </div>
  );
}
