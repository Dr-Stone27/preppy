import type { ReactNode } from "react";
import { composeBowl, detailFor, INTERIOR } from "@/domain/bowl/compose";
import { bowlFromRecipe } from "@/domain/bowl/fromRecipe";
import { CERAMIC, INKED } from "@/domain/bowl/palette";
import { hashSeed } from "@/domain/bowl/seed";
import type { BowlSpec, Detail, Shape } from "@/domain/bowl/types";
import type { Recipe } from "@/domain/recipes/types";

export const BOWL_SIZES = { xs: 40, sm: 64, md: 104, lg: 160, hero: 232 } as const;
export type BowlSize = keyof typeof BOWL_SIZES;

/** "flat" is the original style; "inked" outlines each piece and lifts it off the base with a shadow. */
export type BowlLook = "flat" | "inked";

type Props = {
  /** Either a recipe (the bowl is derived from it) or an explicit spec. */
  recipe?: Recipe;
  spec?: BowlSpec;
  size?: BowlSize | number;
  look?: BowlLook;
  /** Decorative bowls are hidden from screen readers; otherwise the dish name is announced. */
  decorative?: boolean;
  label?: string;
  className?: string;
};

/** Ink weight per detail level: thicker when small, so the line survives being scaled down. */
const INK_WIDTH: Record<Detail, number> = { low: 3.6, mid: 2.2, high: 1.5 };

function draw(s: Shape, i: number, ink?: { color: string; width: number }) {
  // Solid pieces get the ink line; highlights, seams and stroke-only marks don't.
  const outline = ink && s.lift && !s.bare && s.fill && s.fill !== "none" && (s.opacity ?? 1) >= 0.9;
  const stroke = outline ? ink.color : s.stroke;
  const sw = outline ? ink.width : s.sw;
  switch (s.kind) {
    case "circle":
      return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} opacity={s.opacity} stroke={stroke} strokeWidth={sw} />;
    case "ellipse":
      return (
        <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={s.fill} opacity={s.opacity} stroke={stroke} strokeWidth={sw}
          transform={`rotate(${s.rot.toFixed(1)} ${s.cx.toFixed(1)} ${s.cy.toFixed(1)})`} />
      );
    case "rect": {
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
      return (
        <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} fill={s.fill} opacity={s.opacity} stroke={stroke} strokeWidth={sw}
          transform={`rotate(${s.rot.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})`} />
      );
    }
    case "path":
      return <path key={i} d={s.d} fill={s.fill ?? "none"} stroke={stroke} strokeWidth={sw} strokeLinecap="round" opacity={s.opacity} />;
  }
}

/**
 * Preppy's signature dish art: a top-down ceramic bowl drawn from the recipe's own ingredients.
 * Deterministic per recipe id, vector only, legible from 40px to hero size.
 */
export function BowlIllustration({ recipe, spec, size = "md", look = "flat", decorative, label, className }: Props) {
  const px = typeof size === "number" ? size : BOWL_SIZES[size];
  const bowl: BowlSpec =
    spec ?? (recipe ? bowlFromRecipe(recipe) : { cuisine: "other", base: "sauce", color: "#B97A4A", pieces: [], extras: [], seed: "generic" });
  const detail = detailFor(px);
  const { base, shapes } = composeBowl(bowl, detail);
  const id = `bowl-${hashSeed(bowl.seed + px + look).toString(36)}`;
  const name = label ?? recipe?.title ?? "Dish";
  const { cx, cy, r } = INTERIOR;
  const inked = look === "inked";
  const ink = inked ? { color: INKED.ink, width: INK_WIDTH[detail] } : undefined;

  // Consecutive lifted pieces share one shadow group, so the drawing order is kept.
  const food: ReactNode[] = [];
  for (let i = 0; i < shapes.length; ) {
    if (inked && shapes[i].lift) {
      const run: ReactNode[] = [];
      for (; i < shapes.length && shapes[i].lift; i++) run.push(draw(shapes[i], i, ink));
      food.push(
        <g key={`lift-${i}`} filter={`url(#${id}-lift)`}>
          {run}
        </g>,
      );
    } else {
      food.push(draw(shapes[i], i, ink));
      i++;
    }
  }

  const c = inked ? INKED : CERAMIC;
  return (
    <svg
      viewBox="0 0 200 200"
      width={px}
      height={px}
      className={className}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative ? true : undefined}
      style={{ flex: "none" }}
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        <radialGradient id={`${id}-depth`} cx="50%" cy="46%" r="52%">
          <stop offset="72%" stopColor={CERAMIC.shadow} stopOpacity="0" />
          <stop offset="100%" stopColor={CERAMIC.shadow} stopOpacity="0.22" />
        </radialGradient>
        {inked && (
          <filter id={`${id}-lift`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1.2" dy="2.4" stdDeviation={detail === "low" ? 0.8 : 1.4} floodColor={INKED.ink} floodOpacity="0.28" />
          </filter>
        )}
      </defs>
      {/* contact shadow on the counter */}
      <ellipse cx="100" cy="190" rx="66" ry="6.5" fill={CERAMIC.shadow} opacity={inked ? 0.1 : 0.06} />
      {/* vessel */}
      <circle cx={cx} cy={cy} r="93.5" fill={c.vessel} stroke={inked ? INKED.ink : CERAMIC.rim} strokeWidth={inked ? ink!.width + 0.5 : 3.5} />
      {inked && <circle cx={cx} cy={cy} r="91" fill="none" stroke={INKED.rim} strokeWidth="5" />}
      <circle cx={cx} cy={cy} r="82" fill={c.band} stroke={inked ? INKED.ink : CERAMIC.bandLine} strokeWidth={inked ? ink!.width * 0.7 : 1.2} />
      {/* interior */}
      <circle cx={cx} cy={cy} r={r} fill={base} />
      <g clipPath={`url(#${id}-clip)`}>
        {food}
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-depth)`} />
        {/* the inner wall's shadow, top-left, so the food sits inside the bowl */}
        {inked && <path d={`M ${cx - r} ${cy + 10} A ${r} ${r} 0 0 1 ${cx + 12} ${cy - r} A ${r + 6} ${r + 6} 0 0 0 ${cx - r} ${cy + 10} Z`} fill={INKED.ink} opacity="0.12" />}
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={inked ? INKED.ink : CERAMIC.shadow} strokeOpacity={inked ? 0.9 : 0.07} strokeWidth={inked ? ink!.width : 2} />
      {/* glaze highlight on the rim */}
      <path d="M 38 62 A 74 74 0 0 1 78 26" fill="none" stroke={inked ? INKED.rimLight : "#FFFDF9"} strokeWidth="5" strokeLinecap="round" opacity={inked ? 0.9 : 0.75} />
    </svg>
  );
}
