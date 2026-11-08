import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "accent" | "text" | "danger";
type Size = "md" | "sm";

type Common = { variant?: Variant; size?: Size; block?: boolean; children: ReactNode; className?: string };

function cls(variant: Variant, size: Size, block?: boolean, extra?: string) {
  return [styles.btn, styles[variant], styles[size], block && styles.block, extra].filter(Boolean).join(" ");
}

/** Button element. Teal primary, outline secondary, orange accent (espresso text). */
export function Button({
  variant = "primary",
  size = "md",
  block,
  className,
  children,
  type = "button",
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cls(variant, size, block, className)} {...rest}>
      {children}
    </button>
  );
}

/** Same look as Button, for navigation. */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  block,
  className,
  children,
}: Common & { href: string }) {
  return (
    <Link href={href} className={cls(variant, size, block, className)}>
      {children}
    </Link>
  );
}

export function IconButton({
  label,
  children,
  className,
  type = "button",
  ...rest
}: { label: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} aria-label={label} className={[styles.icon, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </button>
  );
}
