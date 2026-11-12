import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import prefs from "@/components/prefs/Preferences.module.css";
import styles from "./Privacy.module.css";

/** What Preppy keeps, where, and how to remove it. */
export function Privacy() {
  return (
    <div className={prefs.page}>
      <Link href="/" className={prefs.back}>
        <Icon name="back" size={20} />
        Home
      </Link>
      <h1 className="t-h1">Privacy</h1>
      <div className={styles.body}>
        <p>Preppy is a small app in early testing. This page says what it keeps, where, and how to remove it.</p>

        <h2 className="t-h3">On this device</h2>
        <p>Your plans, pantry, settings and the recipes you save are kept in this browser, so Preppy works without an account.</p>

        <h2 className="t-h3">With an account</h2>
        <p>
          Your email address, plus a copy of your plans, pantry, settings and saved recipes so they follow you to other devices. These are stored with Supabase in
          Ireland. Preppy also counts how many posts you have read each day, to keep the recipe reader fair for everyone.
        </p>

        <h2 className="t-h3">The recipe reader</h2>
        <p>
          The caption and link you give it, and any fridge photo you take in What can I make?, are sent to Google’s Gemini AI. Preppy uses Gemini’s free tier, under which Google may use
          what is sent to improve its products, so leave anything personal out.
        </p>

        <h2 className="t-h3">How Preppy is used</h2>
        <p>
          Preppy records which screens are opened and a few steps, like finishing setup or planning a cook, using PostHog. This shows where the app is confusing. It
          does not record what you type, and it is not used for advertising.
        </p>

        <h2 className="t-h3">Emails</h2>
        <p>Only sign-in emails. No newsletters.</p>

        <h2 className="t-h3">Removing it</h2>
        <p>
          <Link href="/settings">Settings</Link> → Delete my account removes your account and everything saved to it. Signing out clears this device.
        </p>

        <p>Nothing is sold or shared for advertising. Questions: reply to any sign-in email.</p>
        <p className="t-small t-muted">Updated 8 November 2026.</p>
      </div>
    </div>
  );
}
