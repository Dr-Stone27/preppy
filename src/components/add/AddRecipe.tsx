"use client";

import { track } from "@/lib/analytics";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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
import { AccountPanel } from "@/components/account/AccountPanel";
import { FromInstagram, SHORTCUT, SHORTCUT_VERSION } from "./FromInstagram";
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
  401: "Sign in to read recipes from posts. It’s free, and your post stays here while you do.",
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

const DRAFT = "preppy:add-draft";

/** The link and caption being added, kept so leaving the page (to sign in, say) doesn't lose them. */
function loadDraft(): { link: string; text: string } {
  try {
    const d = typeof window === "undefined" ? null : JSON.parse(sessionStorage.getItem(DRAFT) ?? "null");
    return d && typeof d.link === "string" && typeof d.text === "string" ? d : { link: "", text: "" };
  } catch {
    return { link: "", text: "" };
  }
}

function saveDraft(d: { link: string; text: string } | null) {
  try {
    if (d && (d.link || d.text)) sessionStorage.setItem(DRAFT, JSON.stringify(d));
    else sessionStorage.removeItem(DRAFT);
  } catch {}
}

/** The version the iPhone Shortcut stamps on what it sends (#v=6&shared=…); 0 for older copies and other routes. */
function shortcutVersion(): number {
  if (typeof window === "undefined") return 0;
  return Number(window.location.hash.match(/[#&]v=(\d+)/)?.[1] ?? 0);
}

function fromAddress(params: URLSearchParams): { link: string; text: string } {
  // The Shortcut puts it after # (kept in the browser, so any length works); older links used ?shared=.
  const shared = sharedFromHref() ?? params.get("shared");
  const raw = shared != null ? decode(shared) : [params.get("url"), params.get("text")].filter(Boolean).join("\n");
  if (!raw.trim()) return { link: "", text: "" };
  const post = parseShared(raw.trim());
  if (post) return { link: post.link, text: post.caption };
  const url = raw.match(POST_LINK)?.[0];
  return url ? { link: url.split("?")[0], text: raw.replace(url, "").trim() } : { link: "", text: raw.trim() };
}

const onHashChange = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

/**
 * What the Shortcut sends sits after # in the address, which the server never sees, and the draft lives in this
 * browser. So the form is only drawn once the page is running here, and drawn afresh if a new post arrives.
 */
export function AddRecipe() {
  const hash = useSyncExternalStore(onHashChange, () => window.location.hash, () => null);
  if (hash === null) return <div style={{ minHeight: "60vh" }} aria-busy="true" />;
  return <AddRecipeForm key={hash} />;
}

function AddRecipeForm() {
  const data = useData();
  const params = useSearchParams();
  // What arrived from Instagram or TikTok, or failing that, whatever was being added before (e.g. before signing in).
  const [arrived] = useState(() => {
    const a = fromAddress(params);
    return a.link || a.text ? a : loadDraft();
  });
  const source = /tiktok/i.test(arrived.link) ? "TikTok" : "Instagram";
  // Sent by an iPhone Shortcut older than the one on the site: it may cut long captions.
  const [oldShortcut] = useState(() => typeof window !== "undefined" && window.location.hash.includes("shared=") && shortcutVersion() < SHORTCUT_VERSION);
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

  useEffect(() => saveDraft({ link, text }), [link, text]);

  // Signing in from the box below picks up where it stopped: read the post again.
  const waitingForSignIn = state.s === "error" && state.signIn;
  const retried = useRef(false);
  useEffect(() => {
    if (!waitingForSignIn || retried.current || !sync.email || sync.status === "loading") return;
    retried.current = true; // once: each read counts against the day's allowance
    setTimeout(read, 0);
  });

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
    saveDraft(null);
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
        {state.s === "saved" && <p className="t-small t-muted">It’s in your library under Saved by you. Pick it when you plan a cook.</p>}
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
          {oldShortcut && (
            <p className={styles.outdated} role="status">
              Your Save to Preppy shortcut is out of date and may cut long captions. Delete it in the Shortcuts app, then{" "}
              <a href={SHORTCUT} download="Save to Preppy.shortcut">
                get the new one
              </a>
              .
            </p>
          )}
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
              <div className={styles.errorHead}>
                <Icon name="alert" size={20} />
                <p>{state.message}</p>
              </div>
              {state.signIn && (
                <div className={styles.inlineSignIn}>
                  <AccountPanel />
                </div>
              )}
              {state.offerTyping && !state.signIn && (
                <Button variant="secondary" size="sm" onClick={() => setMode("type")}>
                  Type the recipe in instead
                </Button>
              )}
            </div>
          )}

          <FromInstagram />

          <p className="t-label t-muted">
            Recipes you save show in the <Link href="/library">library</Link> under Saved by you, and you can pick them when you plan a cook.
          </p>
        </>
      )}
    </div>
  );
}
