"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
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
import { addExtra, getWeek, newExtraId, useData } from "@/state/store";
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

/** Pick the fresh food you have and see which dishes it makes. */
export function WhatCanIMake() {
  const data = useData();
  const [picked, setPicked] = useState<Picked>(load);
  const [typed, setTyped] = useState("");
  const [note, setNote] = useState("");
  const [more, setMore] = useState(false);

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

  const next = nextOpenCook(data.weeks, data.prefs, today0(), (k) => getWeek(data, k));
  const cookName = `${dayName(next.weekStart, next.round.cook, true)}’s`;
  const matches = has.size ? cookFromWhatYouHave(allRecipes(), has, data.pantry, picked.custom) : [];
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
                    {(m.have.length > 0 || !missing) && (
                      <p className="t-small">
                        <b>{missing ? "You have" : "Nothing to buy."}</b> {missing ? list(m.have) : m.have.length ? `You have ${list(m.have)}.` : ""}
                      </p>
                    )}
                    {m.swaps.length > 0 && (
                      <p className="t-small">
                        <b>Use</b>{" "}
                        {m.swaps.map((s, i) => (
                          <span key={s.for}>
                            {i > 0 && "; "}
                            {s.use} instead of {s.for} <span className="t-muted">({s.close ? "close" : "changes the taste"})</span>
                          </span>
                        ))}
                      </p>
                    )}
                    {m.needFresh.length > 0 && (
                      <p className="t-small">
                        <b>Need</b> {list(m.needFresh.map((x) => x.name))}
                      </p>
                    )}
                    {m.needShelf.length > 0 && (
                      <p className="t-small t-muted">Also needs from the cupboard: {list(m.needShelf.map((x) => x.name))}</p>
                    )}
                    <div className={styles.actions}>
                      <ButtonLink href={`/plan?build=${next.round.id}&add=${m.recipe.id}${next.ahead ? "&week=next" : ""}`} size="sm">
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
