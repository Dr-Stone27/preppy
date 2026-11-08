"use client";

import { track } from "@/lib/analytics";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { findBySource, recipeHref } from "@/domain/recipes/library";
import { parseShared, POST_LINK, recipeFromAi } from "@/domain/recipes/import";
import { ruleWarnings, warningSentence } from "@/domain/recipes/rules";
import type { Recipe } from "@/domain/recipes/types";
import { authHeader } from "@/lib/supabase";
import { saveRecipe, useData } from "@/state/store";
import { useSync } from "@/state/sync";
import { FromInstagram } from "./FromInstagram";
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
  400: "Paste the caption or type a short note first.",
  401: "Sign in to read recipes from posts. It’s free, and keeps your recipes on every device.",
  402: "You’ve read a lot of posts today. Try again tomorrow, or type this one in.",
};

/**
 * What arrived in the address: the iPhone Shortcut sends `shared` ("link\ncaption"),
 * Android's share button sends `text` and sometimes `url` when Preppy is installed.
 */
/** The Shortcut passes the post page's summary as-is, so quotes and emoji arrive as HTML entities. */
function decode(s: string) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/**
 * Everything after "shared=" in the address. If the Shortcut leaves an "&" or "#" from a caption unencoded,
 * the normal reading would cut the caption there, so take the rest of the address and decode what can be decoded.
 */
function sharedFromHref(): string | null {
  if (typeof window === "undefined") return null;
  const href = window.location.href;
  const at = href.indexOf("shared=");
  if (at < 0) return null;
  const rest = href.slice(at + "shared=".length);
  try {
    return decodeURIComponent(rest);
  } catch {
    return rest.replace(/(%[0-9a-f]{2})+/gi, (m) => {
      try {
        return decodeURIComponent(m);
      } catch {
        return m;
      }
    });
  }
}

function fromAddress(params: URLSearchParams): { link: string; text: string } {
  const shared = params.has("shared") ? sharedFromHref() ?? params.get("shared") ?? "" : null;
  const raw = shared != null ? decode(shared) : [params.get("url"), params.get("text")].filter(Boolean).join("\n");
  if (!raw.trim()) return { link: "", text: "" };
  const post = parseShared(raw.trim());
  if (post) return { link: post.link, text: post.caption };
  const url = raw.match(POST_LINK)?.[0];
  return url ? { link: url.split("?")[0], text: raw.replace(url, "").trim() } : { link: "", text: raw.trim() };
}

export function AddRecipe() {
  const data = useData();
  const params = useSearchParams();
  const [arrived] = useState(() => fromAddress(params));
  const source = /tiktok/i.test(arrived.link) ? "TikTok" : "Instagram";
  const [mode, setMode] = useState<Mode>("post");
  const [link, setLink] = useState(arrived.link);
  const [text, setText] = useState(arrived.text);

  const [state, setState] = useState<State>({ s: "idle" });
  const ctl = useRef<AbortController | null>(null);
  const sync = useSync();
  const autoRead = useRef(false);

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
        headers: { "content-type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ text, link, never: data?.prefs.never ?? [] }),
        signal: ctl.current.signal,
      });
      if (!res.ok) return setState({ s: "error", message: ERRORS[res.status] ?? "That didn’t work. Try again, or type the recipe in.", offerTyping: res.status !== 400, signIn: res.status === 401 });
      const { recipe } = (await res.json()) as { recipe: unknown };
      setState({ s: "check", recipe: recipeFromAi(recipe, link) });
      track("recipe_read", { from_share: !!arrived.text });
    } catch (e) {
      if ((e as Error).name === "AbortError") return setState({ s: "idle" });
      setState({ s: "error", message: "That didn’t work. Try again, or type the recipe in.", offerTyping: true });
    } finally {
      ctl.current = null;
    }
  };

  // A post shared from Instagram or TikTok with its caption reads straight away, once sign-in has loaded.
  useEffect(() => {
    if (autoRead.current || !arrived.text || !data || sync.status === "loading") return;
    autoRead.current = true;
    // Not cleared on re-render: the guard above has already flipped, so a cleared timer would never be replaced.
    setTimeout(read, 0);
  });

  const save = (r: Recipe) => {
    saveRecipe(r);
    track("recipe_saved", { from: mode === "type" ? "typed" : "post" });
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
          {arrived.link && state.s === "idle" && (
            <p className={styles.arrived} role="status">
              {arrived.text ? `Got the post from ${source}.` : `Got the link, but not the caption. Copy the caption in ${source} and paste it below.`}
            </p>
          )}
          <label className={styles.field}>
            <span>Instagram or TikTok link</span>
            <input type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste the post link" />
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

          <FromInstagram />

          <p className="t-label t-muted">
            Recipes you save show in the <Link href="/library">library</Link> under Saved by you.
          </p>
        </>
      )}
    </div>
  );
}
