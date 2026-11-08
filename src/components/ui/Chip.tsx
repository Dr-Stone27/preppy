import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Chip.module.css";

export type ChipTone = "neutral" | "accent" | "success" | "warning" | "danger";

/** Static label. Status tones always pair colour with words. */
export function Tag({ tone = "neutral", children }: { tone?: ChipTone; children: ReactNode }) {
  return <span className={`${styles.tag} ${styles[tone]}`}>{children}</span>;
}

/** Selectable chip (filters, multi-select answers). */
export function FilterChip({
  selected,
  children,
  ...rest
}: { selected: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-pressed={selected} className={styles.filter} {...rest}>
      {children}
    </button>
  );
}
