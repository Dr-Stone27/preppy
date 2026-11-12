"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { AccountPanel } from "@/components/account/AccountPanel";
import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FilterChip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { dayName, today0 } from "@/domain/plan/dates";
import { nextOpenCook, slug } from "@/domain/plan/week";
import { cookFromWhatYouHave, type Match } from "@/domain/recipes/have";
import { allRecipes, recipeHref } from "@/domain/recipes/library";
import { cardLabel } from "@/domain/recipes/search";
import { groupOf, guessGroup, pantryItems, pantryMatch, SHOP_ORDER } from "@/domain/shop/pantry";
import { track } from "@/lib/analytics";
import { shrink } from "@/lib/images";
import { authHeader } from "@/lib/supabase";
import { addExtra, getWeek, newExtraId, useData } from "@/state/store";
import { useSync } from "@/state/sync";
import prefs from "@/components/prefs/Preferences.module.css";
import styles from "./WhatCanIMake.module.css";

/** Ticked fresh food is kept for this visit only: it goes off, so last week's ticks would mislead. */
const KEY = "preppy:have";
type Picked = { keys: string[]; custom: Record<string, string> };

function load(): Picked {
  try {
    const d = typeof window === "undefined" ? null : JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    return d && Array.isArray(d.keys) ? { keys: d.keys, custom: d.custom ?? {} } : { keys: [], custom: {} };
  } catch {
    return { keys: [], custom: {} };
  }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const list = (xs: string[], max = 3) => (xs.length > max ? `${xs.slice(0, max).join(", ")} and ${xs.length - max} more` : xs.join(", "));

/** Pick the fresh food you have, by tapping or from a photo, and see which dishes it makes. */
export function WhatCanIMake() {
  const data = useData();
  const sync = useSync();
  const [picked, setPicked] = useState<Picked>(load);
  const [typed, setTyped] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<"idle" | "reading" | "sign-in" | "error">("idle");
  const [photoNote, setPhotoNote] = useState("");
  const [more, setMore] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => track("what_can_i_make_opened"), []);
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(picked));
    } catch {}
  }, [picked]);

  if (!data) return <div style={{ minHeight: "60vh" }} aria-busy="true" />;

  const freshItems = pantryItems().filter((p) => p.fresh);
  const has = new Set(picked.keys);
  const toggle = (key: string) => setPicked((p) => ({ ...p, keys: has.has(key) ? p.keys.filter((k) => k !== key) : [...p.keys, key] }));

  const addTyped = (e: FormEvent) => {
    e.preventDefault();
    const name = typed.trim().toLowerCase();
    if (!name) return;
    const match = pantryMatch(name);
    const key = match?.id ?? slug(name);
    setPicked((p) => ({ keys: p.keys.includes(key) ? p.keys : [...p.keys, key], custom: match ? p.custom : { ...p.custom, [key]: name } }));
    setTyped("");
  };

  const readPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setPhoto("reading");
    setPhotoNote("");
    try {
      const shot = await shrink(f);
      const res = await fetch("/api/read-fridge", {
        method: "POST",
        headers: { "content-type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ image: { mime: shot.mime, data: shot.data } }),
      });
      if (res.status === 401) return setPhoto("sign-in");
      if (!res.ok) {
        setPhoto("error");
        return setPhotoNote(res.status === 402 ? "You’ve used today’s AI reads. Tick things by hand, or try tomorrow." : "Couldn’t read that photo. Try again in better light, or tick things by hand.");
      }
      const { items } = (await res.json()) as { items: string[] };
      const found: Picked = { keys: [], custom: {} };
      for (const name of items) {
        const m = pantryMatch(name);
        const key = m?.id ?? slug(name);
        if (!found.keys.includes(key)) found.keys.push(key);
        if (!m) found.custom[key] = name.toLowerCase();
      }
      setPicked((p) => ({ keys: [...new Set([...p.keys, ...found.keys])], custom: { ...p.custom, ...found.custom } }));
      track("fridge_photo_read", { found: items.length });
      setPhoto("idle");
      setPhotoNote(items.length ? `Found ${list(items.map((x) => x.toLowerCase()), 6)}. Untick anything that’s wrong.` : "Couldn’t see any food in that photo. Try one closer up.");
    } catch {
      setPhoto("error");
      setPhotoNote("Couldn’t read that photo. Try again, or tick things by hand.");
    }
  };

  const next = nextOpenCook(data.weeks, data.prefs, today0(), (k) => getWeek(data, k));
  const cookName = `${dayName(next.weekStart, next.round.cook, true)}’s`;
  const matches = has.size ? cookFromWhatYouHave(allRecipes(), has, data.pantry) : [];
  const shown = more ? matches : matches.slice(0, 12);

  const addMissing = (m: Match) => {
    let n = 0;
    for (const { name } of [...m.needFresh, ...m.needShelf]) {
      const match = pantryMatch(name);
      const display = match?.name ?? cap(name);
      if (addExtra(next.weekKey, next.round.id, { id: newExtraId(), name: display, group: groupOf(match?.group ?? guessGroup(name)) })) n++;
    }
    track("list_item_added", { from: "have", count: n });
    setNote(n ? `Added ${n} to ${cookName} shopping list.` : `Those are already on ${cookName} shopping list.`);
  };

  const groups = SHOP_ORDER.map((g) => ({ g, items: freshItems.filter((p) => groupOf(p.group) === g) })).filter((x) => x.items.length);
  const customKeys = picked.keys.filter((k) => picked.custom[k]);

  return (
    <div className={prefs.page}>
      <Link href="/" className={prefs.back}>
        <Icon name="back" size={20} />
        Home
      </Link>
      <div>
        <h1 className="t-h1">What can I make?</h1>
        <p className="t-muted">Tick the fresh food you have. Dry goods, spices and sauces come from what you’ve marked at home.</p>
      </div>

      <section className={styles.photo}>
        <div>
          <h2 className="t-h3">Snap your fridge</h2>
          <p className="t-small t-muted">Take a photo and Preppy ticks what it can see. Uses one of your daily AI reads.</p>
        </div>
        <Button variant="secondary" disabled={photo === "reading"} onClick={() => file.current?.click()}>
          {photo === "reading" ? "Looking…" : "Take a photo"}
        </Button>
        <input ref={file} type="file" accept="image/*" capture="environment" hidden onChange={readPhoto} />
        {photoNote && (
          <p className={photo === "error" ? styles.bad : styles.good} role="status">
            {photoNote}
          </p>
        )}
        {photo === "sign-in" && !sync.email && (
          <div className={styles.signIn}>
            <p className="t-small">Reading a photo needs a free account. Sign in with the code we email you, then take the photo again.</p>
            <AccountPanel />
          </div>
        )}
      </section>

      {groups.map(({ g, items }) => (
        <section key={g} className={styles.group}>
          <h2 className="t-label t-muted">{g}</h2>
          <div className={styles.chips}>
            {items.map((p) => (
              <FilterChip key={p.id} selected={has.has(p.id)} onClick={() => toggle(p.id)}>
                {p.name}
              </FilterChip>
            ))}
          </div>
        </section>
      ))}

      <form className={styles.add} onSubmit={addTyped}>
        <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Something else, like okra" aria-label="Add something you have" />
        <button type="submit" disabled={!typed.trim()}>
          Add
        </button>
      </form>
      {customKeys.length > 0 && (
        <div className={styles.chips}>
          {customKeys.map((k) => (
            <FilterChip key={k} selected onClick={() => toggle(k)}>
              {cap(picked.custom[k])}
            </FilterChip>
          ))}
        </div>
      )}
      {has.size > 0 && (
        <button type="button" className={styles.clear} onClick={() => setPicked({ keys: [], custom: {} })}>
          Clear all
        </button>
      )}

      <section className={styles.results} aria-label="Dishes you can make">
        {!has.size ? (
          <p className="t-small t-muted">Tick a few things to see what you can make.</p>
        ) : !matches.length ? (
          <p className="t-small t-muted">No dish uses those yet. Try ticking a meat or a vegetable.</p>
        ) : (
          <>
            <h2 className="t-h3">
              {matches.filter((m) => !m.needFresh.length && !m.needShelf.length).length
                ? "You can make these"
                : "Closest to what you have"}
            </h2>
            {note && (
              <p className={styles.good} role="status">
                {note}{" "}
                <Link href={`/shop?week=${next.weekKey}&round=${next.round.id}`}>See the list</Link>
              </p>
            )}
            <ul className={styles.list}>
              {shown.map((m) => {
                const missing = m.needFresh.length + m.needShelf.length;
                return (
                  <li key={m.recipe.id} className={styles.card}>
                    <Link href={recipeHref(m.recipe)} className={styles.cardHead}>
                      <BowlIllustration recipe={m.recipe} size={56} decorative />
                      <span>
                        <span className={styles.title}>{m.recipe.title}</span>
                        <span className="t-label t-muted">{cardLabel(m.recipe)}</span>
                      </span>
                    </Link>
                    <p className="t-small">
                      <b>{missing ? "You have" : "Nothing to buy."}</b> {missing ? list(m.have) : `You have ${list(m.have)}.`}
                    </p>
                    {m.needFresh.length > 0 && (
                      <p className="t-small">
                        <b>Need</b> {list(m.needFresh.map((x) => x.name))}
                      </p>
                    )}
                    {m.needShelf.length > 0 && (
                      <p className="t-small t-muted">From the cupboard: {list(m.needShelf.map((x) => x.name))}</p>
                    )}
                    <div className={styles.actions}>
                      <ButtonLink href={`/plan?build=${next.round.id}&add=${m.recipe.id}`} size="sm">
                        Plan it for {cookName} cook
                      </ButtonLink>
                      {missing > 0 && (
                        <Button variant="secondary" size="sm" onClick={() => addMissing(m)}>
                          Add {missing} to my list
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {!more && matches.length > shown.length && (
              <Button variant="secondary" block onClick={() => setMore(true)}>
                Show {matches.length - shown.length} more
              </Button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
