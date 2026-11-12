"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { sendCode, signOut, useSync, verifyCode } from "@/state/sync";
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
    return "Too many emails asked for. Wait a minute, then try again.";
  if (err.code === "otp_expired" || err.code === "invalid_credentials" || /token|otp/i.test(err.message ?? ""))
    return "That code didn’t work. Check it, or send a new one.";
  if (err.code === "email_address_invalid" || /invalid.*email|email.*invalid/i.test(err.message ?? "")) return "Check the email address.";
  // Supabase couldn't hand the email to the mail server (for example the Gmail connection was refused).
  if (/sending|smtp|mail server/i.test(err.message ?? "") || (err.status ?? 0) >= 500)
    return `We couldn’t send the email just now. Try again in a few minutes.${err.code ? ` (${err.code})` : ""}`;
  return `Something went wrong. Try again.${err.code ? ` (${err.code})` : ""}`;
}

/** Sign in with an emailed code (or the link in the same email), and show sync status once signed in. */
export function AccountPanel() {
  const sync = useSync();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
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
        <Button variant="secondary" size="sm" onClick={() => signOut().then(() => router.replace("/account"))}>
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
      console.error("[sign-in]", err);
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
          {busy ? "Sending…" : "Email me a sign-in code"}
        </Button>
        <p className="t-label t-muted">
          What Preppy keeps and why: <Link href="/privacy">Privacy</Link>
        </p>
      </form>
    );
  }

  const digits = code.replace(/\D/g, "");
  return (
    <form className={styles.panel} onSubmit={(e) => run(e, () => verifyCode(email.trim(), digits))}>
      <p className="t-small">
        We sent a code to <strong>{email.trim()}</strong>. Type it here to sign in, wherever you opened Preppy.
      </p>
      <label className={form.field}>
        <span>Code from the email</span>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
          maxLength={12}
        />
      </label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <Button type="submit" block disabled={busy || digits.length < 6}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
      <p className="t-label t-muted">The email also has a link. It opens in your default browser and works once. Nothing arrived? Check spam.</p>
      <button
        type="button"
        className={form.link}
        onClick={() => {
          setSent(false);
          setCode("");
          setError("");
        }}
      >
        Use a different email or send again
      </button>
    </form>
  );
}
