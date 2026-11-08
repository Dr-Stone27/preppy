"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { findBySource, recipeHref } from "@/domain/recipes/library";
import { parseShared, recipeFromAi } from "@/domain/recipes/import";
import { ruleWarnings, warningSentence } from "@/domain/recipes/rules";
import type { Recipe } from "@/domain/recipes/types";
import { saveRecipe, useData } from "@/state/store";
import { RecipeForm } from "./RecipeForm";
import styles from "./Add.module.css";

type Mode = "post" | "type";
type State =
  | { s: "idle" }
  | { s: "reading" }
  | { s: "check"; recipe: Recipe }
  | { s: "saved"; recipe: Recipe }
  | { s: "duplicate"; recipe: Recipe }
  | { s: "error"; message: string; offerTyping?: boolean };

const ERRORS: Record<number, string> = {
  503: "Reading posts isn’t switched on yet. You can type the recipe in instead.",
  429: "Too many requests just now. Try again in a minute.",
  400: "Paste the caption or type a short note first.",
};

export function AddRecipe() {
  const data = useData();
  const [mode, setMode] = useState<Mode>("post");
  const [link, setLink] = useState("");
  const [text, setText] = useState("");
  const [state, setState] = useState<State>({ s: "idle" });
  const ctl = useRef<AbortController | null>(null);

  const onPaste = (value: string) => {
    const shared = parseShared(value);
    if (shared) {
      setLink(shared.link);
      setText(shared.caption);
    } else setText(value);
  };

  const read = async () => {
    const dup = link ? findBySource(link) : undefined;
    if (dup) return setState({ s: "duplicate", recipe: dup });
    if (!text.trim()) return setState({ s: "error", message: ERRORS[400] });
    ctl.current = new AbortController();
    setState({ s: "reading" });
    try {
      const res = await fetch("/api/read-recipe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, link, never: data?.prefs.never ?? [] }),
        signal: ctl.current.signal,
      });
      if (!res.ok) return setState({ s: "error", message: ERRORS[res.status] ?? "That didn’t work. Try again, or type the recipe in.", offerTyping: true });
      const { recipe } = (await res.json()) as { recipe: unknown };
      setState({ s: "check", recipe: recipeFromAi(recipe, link) });
    } catch (e) {
      if ((e as Error).name === "AbortError") return setState({ s: "idle" });
      setState({ s: "error", message: "That didn’t work. Try again, or type the recipe in.", offerTyping: true });
    } finally {
      ctl.current = null;
    }
  };

  const save = (r: Recipe) => {
    saveRecipe(r);
    setState({ s: "saved", recipe: r });
    setLink("");
    setText("");
    window.scrollTo({ top: 0 });
  };

  const reset = () => {
    setState({ s: "idle" });
    window.scrollTo({ top: 0 });
  };

  if (state.s === "saved" || state.s === "duplicate") {
    const r = state.recipe;
    const w = ruleWarnings(r, data?.prefs.never);
    return (
      <div className={styles.result}>
        <BowlIllustration recipe={r} size="lg" decorative />
        <span className="t-eyebrow">{state.s === "saved" ? "Saved" : "Already in your library"}</span>
        <h2 className="t-h2">{r.title}</h2>
        <p className="t-small t-muted">
          {r.ingredients.length} ingredients · makes {r.servings}
          {r.flavour ? ` · ${r.flavour}` : ""}
        </p>
        {w.items.length > 0 && <p className={styles.warn}>{warningSentence(w.items)}</p>}
        {r.note && <p className="t-small t-muted">{r.note}</p>}
        <div className={styles.actions}>
          <ButtonLink href={recipeHref(r)} block>
            Open recipe
          </ButtonLink>
          <Button variant="secondary" block onClick={reset}>
            Add another
          </Button>
        </div>
      </div>
    );
  }

  if (state.s === "check") {
    return (
      <div className={styles.wrap}>
        <div className={styles.checkHead}>
          <BowlIllustration recipe={state.recipe} size="sm" decorative />
          <div>
            <h2 className="t-h3">Check it before saving</h2>
            <p className="t-small t-muted">Fix anything that came out wrong.</p>
          </div>
        </div>
        {state.recipe.note && <p className={styles.note}>{state.recipe.note}</p>}
        <RecipeForm initial={state.recipe} submitLabel="Save recipe" onSubmit={save} onCancel={reset} />
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.segment} role="tablist" aria-label="How to add">
        {(
          [
            ["post", "From a post"],
            ["type", "Type it in"],
          ] as const
        ).map(([m, label]) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}>
            {label}
          </button>
        ))}
      </div>

      {mode === "type" ? (
        <RecipeForm initial={{ source: link || undefined }} submitLabel="Save recipe" onSubmit={save} />
      ) : (
        <>
          <label className={styles.field}>
            <span>Instagram link</span>
            <input type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.instagram.com/reel/…" />
          </label>
          <label className={styles.field}>
            <span>Caption</span>
            <textarea
              rows={8}
              value={text}
              onChange={(e) => onPaste(e.target.value)}
              placeholder="Paste the caption here"
              disabled={state.s === "reading"}
            />
            <small>No caption on the post? A rough note works, like “gochujang chicken: thighs, gochujang, honey, soy, garlic”.</small>
          </label>

          {state.s === "reading" ? (
            <div className={styles.reading} role="status">
              <span className={styles.pulse}>
                <BowlIllustration size="sm" decorative />
              </span>
              <div>
                <p className={styles.readingTitle}>Reading the recipe…</p>
                <p className="t-label t-muted">This can take up to a minute.</p>
              </div>
              <Button variant="text" size="sm" onClick={() => ctl.current?.abort()}>
                Stop
              </Button>
            </div>
          ) : (
            <Button block onClick={read}>
              Read recipe
            </Button>
          )}

          {state.s === "error" && (
            <div className={styles.errorBox} role="alert">
              <Icon name="alert" size={20} />
              <div>
                <p>{state.message}</p>
                {state.offerTyping && (
                  <button type="button" className={styles.link} onClick={() => setMode("type")}>
                    Type it in
                  </button>
                )}
              </div>
            </div>
          )}

          <p className="t-label t-muted">
            Saved recipes stay on this device for now. See them in your <Link href="/library">library</Link>.
          </p>
        </>
      )}
    </div>
  );
}
