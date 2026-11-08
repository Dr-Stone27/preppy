import type { ReactNode } from "react";
import styles from "./Layout.module.css";

export function Card({ children, className, as: Tag = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" }) {
  return <Tag className={[styles.card, className].filter(Boolean).join(" ")}>{children}</Tag>;
}

export function ScreenHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.headerText}>
        {eyebrow && <span className="t-eyebrow">{eyebrow}</span>}
        <h1 className="t-h1">{title}</h1>
      </div>
      {action}
    </header>
  );
}

export function SectionHeader({ title, meta }: { title: ReactNode; meta?: ReactNode }) {
  return (
    <div className={styles.section}>
      <h2 className="t-h2">{title}</h2>
      {meta && <span className="t-small t-muted">{meta}</span>}
    </div>
  );
}

export function EmptyState({
  art,
  title,
  body,
  action,
}: {
  art?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty} role="status">
      {art}
      <h2 className="t-h3">{title}</h2>
      {body && <p className="t-small t-muted">{body}</p>}
      {action}
    </div>
  );
}

export function Stack({ children, gap = 6 }: { children: ReactNode; gap?: 2 | 3 | 4 | 6 | 8 }) {
  return <div className={styles.stack} style={{ gap: `var(--space-${gap})` }}>{children}</div>;
}
