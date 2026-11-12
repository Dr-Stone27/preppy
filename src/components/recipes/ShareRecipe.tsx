"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { accountsOn } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import type { Recipe } from "@/domain/recipes/types";
import { shareOf, shareRecipe, unshareRecipe } from "@/state/share";
import { updatePrefs, useData } from "@/state/store";
import { useSync } from "@/state/sync";
import styles from "./ShareRecipe.module.css";

type State = "loading" | "off" | "on" | "hidden";

/** The "Share with everyone" switch on a recipe you saved. Off until you turn it on. */
export function ShareRecipe({ recipe: r }: { recipe: Recipe }) {
  const sync = useSync();
  const data = useData();
  const signedIn = !!sync.email;
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const name = data?.prefs.shareName ?? "";

  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    shareOf(r.id)
      .then((s) => live && setState(!s ? "off" : s.hidden ? "hidden" : "on"))
      .catch(() => live && setState("off"));
    return () => {
      live = false;
    };
  }, [signedIn, r.id]);

  if (!accountsOn || r.copiedFrom) return null;

  if (!signedIn)
    return (
      <section className={styles.box}>
        <h2 className="t-h3">Share with other cooks</h2>
        <p className="t-small t-muted">
          <Link href="/account">Sign in</Link> to share this recipe so anyone using Preppy can find and save it. It stays private until you do.
        </p>
      </section>
    );

  const set = async (on: boolean) => {
    setBusy(true);
    setError("");
    try {
      if (on) await shareRecipe(r, name);
      else await unshareRecipe(r.id);
      setState(on ? "on" : "off");
      track(on ? "recipe_shared" : "recipe_unshared");
    } catch (e) {
      setError(/limit/.test(String((e as Error).message)) ? "You’ve shared 100 recipes, the most for now." : "Couldn’t change that just now. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const on = state === "on" || state === "hidden";

  return (
    <section className={styles.box}>
      <label className={styles.switchRow}>
        <span>
          <span className={styles.label}>Share with everyone</span>
          <span className="t-small t-muted">
            {on ? "Other cooks can find this in the library and save their own copy." : "Only you can see this recipe."}
          </span>
        </span>
        <input type="checkbox" role="switch" className={styles.switch} checked={on} disabled={busy || state === "loading"} onChange={(e) => set(e.target.checked)} />
      </label>

      {state === "hidden" && <p className={styles.warn}>Other cooks reported this recipe, so it’s hidden from the library for now.</p>}

      <label className={styles.field}>
        <span className="t-label">Name to show (optional)</span>
        <input
          value={name}
          maxLength={30}
          placeholder="Your first name"
          autoComplete="given-name"
          onChange={(e) => updatePrefs((p) => ({ ...p, shareName: e.target.value }))}
          onBlur={() => on && !busy && set(true)}
        />
      </label>

      <p className="t-label t-muted">
        Your email is never shown. A recipe saved from a post keeps the creator’s name and a link to the original. Turn this off any time and it leaves the library; copies other cooks already saved stay with them.
      </p>
      {error && (
        <p className={styles.warn} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
