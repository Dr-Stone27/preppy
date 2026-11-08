"use client";

import { type FormEvent, useState } from "react";
import { FilterChip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { customTerms, hasOption, NEVER_OPTIONS, SIDE_OPTIONS, toggleOption } from "@/domain/prefs/options";
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
      <AddWord placeholder="Something else, like coconut" label="Add a food to avoid" onAdd={(w) => onChange([...new Set([...never, w])])} />
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
