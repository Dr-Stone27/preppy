import Link from "next/link";
import type { ReactNode } from "react";
import { BowlIllustration } from "@/components/bowl/BowlIllustration";
import { Ingredients } from "@/components/recipes/Ingredients";
import { Tag } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { ruleWarnings, warningSentence } from "@/domain/recipes/rules";
import type { Recipe } from "@/domain/recipes/types";
import styles from "./RecipeView.module.css";

const MACRO_SOURCE = { post: "From the post", estimate: "Estimate", you: "Your numbers" } as const;

/** The full recipe: bowl, tags, food-rule warnings, macros, scalable ingredients, method and source. */
export function RecipeView({ recipe: r, never, footer }: { recipe: Recipe; never?: string[]; footer?: ReactNode }) {

  const warnings = ruleWarnings(r, never);
  const m = r.macros;
  const macros = m ? ([["kcal", m.kcal, ""], ["Protein", m.protein, "g"], ["Carbs", m.carbs, "g"], ["Fat", m.fat, "g"]] as const).filter(([, v]) => v != null) : [];
  let host = "";
  let href = "";
  try {
    const u = r.source ? new URL(r.source) : null;
    // Only web links; a saved recipe's link came from a paste and could be anything.
    if (u && (u.protocol === "https:" || u.protocol === "http:")) {
      host = u.hostname.replace(/^www\./, "");
      href = u.href;
    }
  } catch {}

  return (
    <article className={styles.page}>
      <Link href="/library" className={styles.back}>
        <Icon name="back" size={20} />
        Library
      </Link>

      <div className={styles.hero}>
        <BowlIllustration recipe={r} size="hero" decorative />
      </div>

      <header className={styles.head}>
        <span className="t-eyebrow">{r.kind === "sweet" ? "Breakfast & sweets" : "Main"}</span>
        <h1 className="t-h1">{r.title}</h1>
        <div className={styles.tags}>
          {r.flavour && <Tag tone="accent">{r.flavour}</Tag>}
          {r.protein && <Tag>{r.protein}</Tag>}
          {r.kind === "main" && r.withCarb && <Tag>Carb included</Tag>}
        </div>
      </header>

      {(warnings.items.length > 0 || warnings.notes.length > 0) && (
        <div className={styles.warning} role="note">
          <Icon name="alert" size={20} />
          <div>
            {warnings.items.length > 0 && <p>{warningSentence(warnings.items)}</p>}
            {warnings.notes.map((n) => (
              <p key={n} className={styles.warningNote}>{n}</p>
            ))}
          </div>
        </div>
      )}

      {macros.length > 0 && (
        <section className={styles.macros} aria-label="Nutrition per serving">
          <div className={styles.macroGrid}>
            {macros.map(([label, value, unit]) => (
              <div key={label} className={styles.macro}>
                <span className={styles.macroValue}>
                  {value}
                  {unit && <small>{unit}</small>}
                </span>
                <span className="t-label t-muted">{label}</span>
              </div>
            ))}
          </div>
          <p className="t-label t-muted">
            Per serving{r.macrosSource ? ` · ${MACRO_SOURCE[r.macrosSource]}` : ""}
          </p>
        </section>
      )}

      <Ingredients ingredients={r.ingredients} servings={r.servings} />

      <section className={styles.section}>
        <h2 className="t-h2">Method</h2>
        <ol className={styles.steps}>
          {r.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </section>

      {r.note && (
        <section className={styles.section}>
          <h2 className="t-h3">Notes</h2>
          <p className="t-small">{r.note}</p>
        </section>
      )}

      {(r.source || r.credit) && (
        <footer className={styles.source}>
          {r.credit && (
            <p className="t-small t-muted">
              Recipe by{" "}
              <a href={r.credit.url} target="_blank" rel="noopener noreferrer">
                {r.credit.name}
              </a>
            </p>
          )}
          {href && (
            <a className={styles.sourceLink} href={href} target="_blank" rel="noopener noreferrer">
              View original{host ? ` on ${host.split(".")[0] === "instagram" ? "Instagram" : host}` : ""}
              <Icon name="chevron" size={18} />
            </a>
          )}
        </footer>
      )}
      {footer}
    </article>
  );
}
