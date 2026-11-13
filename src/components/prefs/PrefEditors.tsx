"use client";

import { type FormEvent, useState } from "react";
import { FilterChip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { coverText, MAX_COOK_DAYS, MAX_PEOPLE } from "@/domain/plan/week";
import { customTerms, hasOption, NEVER_OPTIONS, SIDE_OPTIONS, toggleOption } from "@/domain/prefs/options";
import { allNeeded } from "@/domain/shop/list";
import { stockOf, type Stock } from "@/domain/shop/pantry";
import styles from "./PrefEditors.module.css";

function AddWord({ placeholder, label, onAdd }: { placeholder: string; label: string; onAdd: (w: string) => void }) {
  const [value, setValue] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const w = value.trim().toLowerCase();
    if (w) onAdd(w);
    setValue("");
  };
  return (
    <form className={styles.add} onSubmit={submit}>
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} aria-label={label} />
      <button type="submit" disabled={!value.trim()}>
        Add
      </button>
    </form>
  );
}

function Removable({ word, onRemove }: { word: string; onRemove: () => void }) {
  return (
    <span className={styles.removable}>
      {word}
      <button type="button" onClick={onRemove} aria-label={`Remove ${word}`}>
        <Icon name="close" size={14} strokeWidth={2.2} />
      </button>
    </span>
  );
}

/** Foods to warn about. Recipes containing these words get a warning. */
export function NeverEditor({ never, onChange }: { never: string[]; onChange: (next: string[]) => void }) {
  return (
    <div className={styles.editor}>
      <div className={styles.chips}>
        {NEVER_OPTIONS.map((o) => (
          <FilterChip key={o.label} selected={hasOption(never, o.terms)} onClick={() => onChange(toggleOption(never, o.terms))}>
            {o.label}
          </FilterChip>
        ))}
        {customTerms(never).map((w) => (
          <Removable key={w} word={w} onRemove={() => onChange(never.filter((x) => x !== w))} />
        ))}
      </div>
      <AddWord placeholder="Something else, like okra" label="Add a food to avoid" onAdd={(w) => onChange([...new Set([...never, w])])} />
    </div>
  );
}

/** Sides that rotate in with mains that don't bring their own carb. */
export function SidesEditor({ bases, onChange }: { bases: string[]; onChange: (next: string[]) => void }) {
  const extra = bases.filter((b) => !SIDE_OPTIONS.includes(b));
  return (
    <div className={styles.editor}>
      <div className={styles.chips}>
        {SIDE_OPTIONS.map((s) => (
          <FilterChip key={s} selected={bases.includes(s)} onClick={() => onChange(bases.includes(s) ? bases.filter((x) => x !== s) : [...bases, s])}>
            {s}
          </FilterChip>
        ))}
        {extra.map((w) => (
          <Removable key={w} word={w} onRemove={() => onChange(bases.filter((x) => x !== w))} />
        ))}
      </div>
      <AddWord
        placeholder="Another side, like couscous"
        label="Add a side"
        onAdd={(w) => {
          const name = w.charAt(0).toUpperCase() + w.slice(1);
          if (!bases.some((b) => b.toLowerCase() === w)) onChange([...bases, name]);
        }}
      />
    </div>
  );
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** The days someone batch-cooks on, one to three. `required` stops the last one being removed. */
export function CookDaysEditor({ days, onChange, required = false }: { days: number[]; onChange: (next: number[]) => void; required?: boolean }) {
  const full = days.length >= MAX_COOK_DAYS;
  return (
    <div className={styles.editor}>
      <div className={styles.chips}>
        {WEEKDAYS.map((name, d) => {
          const on = days.includes(d);
          return (
            <FilterChip
              key={d}
              selected={on}
              aria-label={WEEKDAYS_FULL[d]}
              disabled={(!on && full) || (on && required && days.length === 1)}
              onClick={() => onChange(on ? days.filter((x) => x !== d) : [...days, d].sort((a, b) => a - b))}
            >
              {name}
            </FilterChip>
          );
        })}
      </div>
      <p className="t-small t-muted" aria-live="polite">
        {days.length ? coverText(days) : ""}
        {full && days.length ? " That’s the most." : ""}
      </p>
    </div>
  );
}

/** How many people each meal feeds. Every amount and portion scales with it. */
export function PeopleEditor({ people, onChange }: { people: number; onChange: (next: number) => void }) {
  return (
    <div className={styles.stepper}>
      <button type="button" aria-label="One fewer person" disabled={people <= 1} onClick={() => onChange(people - 1)}>
        −
      </button>
      <output aria-live="polite">{people === 1 ? "1 person" : `${people} people`}</output>
      <button type="button" aria-label="One more person" disabled={people >= MAX_PEOPLE} onClick={() => onChange(people + 1)}>
        +
      </button>
    </div>
  );
}

/** The dry goods, spices and sauces the library uses most, most used first. */
export function kitchenStaples(limit = 24) {
  return allNeeded([])
    .filter((x) => x.item && !x.item.fresh)
    .sort((a, b) => b.from.size - a.from.size || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((x) => x.item!);
}

/** Tap what's already in the kitchen; those stay off shopping lists. Nothing is ticked to start with. */
export function KitchenEditor({ statuses, onChange }: { statuses: Record<string, Stock>; onChange: (id: string, stock: Stock) => void }) {
  return (
    <div className={styles.editor}>
      <div className={styles.chips}>
        {kitchenStaples().map((p) => {
          const have = stockOf(statuses, p.id) === "have";
          return (
            <FilterChip key={p.id} selected={have} onClick={() => onChange(p.id, have ? "out" : "have")}>
              {p.name}
            </FilterChip>
          );
        })}
      </div>
    </div>
  );
}
