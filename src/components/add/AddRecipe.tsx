"use client";

import { track } from "@/lib/analytics";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ChangeEvent, useRef, useState } from "react";
import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { findBySource, recipeHref } from "@/domain/recipes/library";
import { parseShared, recipeFromAi } from "@/domain/recipes/import";
import { ruleWarnings, warningSentence } from "@/domain/recipes/rules";
import type { Recipe } from "@/domain/recipes/types";
import { shrink, type Shot } from "@/lib/images";
import { authHeader } from "@/lib/supabase";
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
  | { s: "error"; message: string; offerTyping?: boolean; signIn?: boolean };

const ERRORS: Record<number, string> = {
  503: "Reading posts isn’t switched on yet. You can type the recipe in instead.",
  429: "The recipe reader is busy right now. Try again in a minute, or type it in.",
  400: "Paste the caption, add a screenshot, or type a short note first.",
  413: "Those screenshots are too big to read. Try fewer, or crop them to the caption.",
  401: "Sign in to read recipes from posts. It’s free, and keeps your recipes on every device.",
  402: "You’ve read a lot of posts today. Try again tomorrow, or type this one in.",
};

const MAX_SHOTS = 4;

/**
 * What arrived in the address: the iPhone Shortcut sends `shared` ("link\ncaption"),
 * Android's share button sends `text` and sometimes `url` when Preppy is installed.
 */
function fromAddress(params: URLSearchParams): { link: string; text: string } {
  const raw = params.get("shared") ?? [params.get("url"), params.get("text")].filter(Boolean).join("\n");
  if (!raw.trim()) return { link: "", text: "" };
  const shared = parseShared(raw.trim());
  if (shared) return { link: shared.link, text: shared.caption };
  const url = raw.match(/https?:\/\/(www\.)?instagram\.com\/\S+/i)?.[0];
  return url ? { link: url.split("?")[0], text: raw.replace(url, "").trim() } : { link: "", text: raw.trim() };
}

export function AddRecipe() {
  const data = useData();
  const params = useSearchParams();
  const [arrived] = useState(() => fromAddress(params));
  const [mode, setMode] = useState<Mode>("post");
  const [link, setLink] = useState(arrived.link);
  const [text, setText] = useState(arrived.text);
  const [shots, setShots] = useState<Shot[]>([]);
  const [adding, setAdding] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({ s: "idle" });
  const ctl = useRef<AbortController | null>(null);

  const onPaste = (value: string) => {
    const shared = parseShared(value);
    if (shared) {
      setLink(shared.link);
      setText(shared.caption);
    } else setText(value);
  };

  const addShots = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])].filter((f) => f.type.startsWith("image/")).slice(0, MAX_SHOTS - shots.length);
    e.target.value = "";
    if (!files.length) return;
    setAdding(true);
    try {
      const next = await Promise.all(files.map(shrink));
      setShots((s) => [...s, ...next].slice(0, MAX_SHOTS));
      if (state.s === "error") setState({ s: "idle" });
    } catch {
      setState({ s: "error", message: "Couldn’t open that image. Try a regular screenshot." });
    } finally {
      setAdding(false);
    }
  };

  const read = async () => {
    const dup = link ? findBySource(link) : undefined;
    if (dup) return setState({ s: "duplicate", recipe: dup });
    if (!text.trim() && !shots.length) return setState({ s: "error", message: ERRORS[400] });
    ctl.current = new AbortController();
    setState({ s: "reading" });
    try {
      const res = await fetch("/api/read-recipe", {
        method: "POST",
        headers: { "content-type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ text, link, never: data?.prefs.never ?? [], images: shots.map(({ mime, data }) => ({ mime, data })) }),
        signal: ctl.current.signal,
      });
      if (!res.ok) return setState({ s: "error", message: ERRORS[res.status] ?? "That didn’t work. Try again, or type the recipe in.", offerTyping: res.status !== 400, signIn: res.status === 401 });
      const { recipe } = (await res.json()) as { recipe: unknown };
      setState({ s: "check", recipe: recipeFromAi(recipe, link) });
      track("recipe_read", { screenshots: shots.length, caption: !!text.trim() });
    } catch (e) {
      if ((e as Error).name === "AbortError") return setState({ s: "idle" });
      setState({ s: "error", message: "That didn’t work. Try again, or type the recipe in.", offerTyping: true });
    } finally {
      ctl.current = null;
    }
  };

  const save = (r: Recipe) => {
    saveRecipe(r);
    track("recipe_saved", { from: mode === "type" ? "typed" : "post" });
    setState({ s: "saved", recipe: r });
    setLink("");
    setText("");
    setShots([]);
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

          <div className={styles.field}>
            <span>Or screenshots of the caption</span>
            {shots.length > 0 && (
              <ul className={styles.shots} aria-label="Screenshots added">
                {shots.map((s, i) => (
                  <li key={i}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- a local preview, not a hosted image */}
                    <img src={s.preview} alt={`Screenshot ${i + 1}`} />
                    <button type="button" aria-label={`Remove screenshot ${i + 1}`} onClick={() => setShots((all) => all.filter((_, j) => j !== i))} disabled={state.s === "reading"}>
                      <Icon name="close" size={14} strokeWidth={2.4} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {shots.length < MAX_SHOTS && (
              <Button variant="secondary" size="sm" onClick={() => fileInput.current?.click()} disabled={adding || state.s === "reading"}>
                <Icon name="image" size={18} />
                {adding ? "Adding…" : shots.length ? "Add another" : "Add screenshots"}
              </Button>
            )}
            <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={addShots} />
            <small>Tap “more” on the caption first so all of it shows. Up to {MAX_SHOTS} screenshots.</small>
          </div>

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
                {state.signIn && (
                  <Link href="/account" className={styles.link}>
                    Sign in
                  </Link>
                )}
                {state.offerTyping && (
                  <button type="button" className={styles.link} onClick={() => setMode("type")}>
                    Type it in
                  </button>
                )}
              </div>
            </div>
          )}

          <p className="t-label t-muted">
            Recipes you save show in the <Link href="/library">library</Link> under Saved by you.
          </p>
        </>
      )}
    </div>
  );
}
