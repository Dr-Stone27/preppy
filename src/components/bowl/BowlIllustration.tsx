import { composeBowl, detailFor, INTERIOR } from "@/domain/bowl/compose";
import { bowlFromRecipe } from "@/domain/bowl/fromRecipe";
import { CERAMIC } from "@/domain/bowl/palette";
import { hashSeed } from "@/domain/bowl/seed";
import type { BowlSpec, Shape } from "@/domain/bowl/types";
import type { Recipe } from "@/domain/recipes/types";

export const BOWL_SIZES = { xs: 40, sm: 64, md: 104, lg: 160, hero: 232 } as const;
export type BowlSize = keyof typeof BOWL_SIZES;

type Props = {
  /** Either a recipe (the bowl is derived from it) or an explicit spec. */
  recipe?: Recipe;
  spec?: BowlSpec;
  size?: BowlSize | number;
  /** Decorative bowls are hidden from screen readers; otherwise the dish name is announced. */
  decorative?: boolean;
  label?: string;
  className?: string;
};

function draw(s: Shape, i: number) {
  switch (s.kind) {
    case "circle":
      return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} opacity={s.opacity} stroke={s.stroke} strokeWidth={s.sw} />;
    case "ellipse":
      return (
        <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={s.fill} opacity={s.opacity} stroke={s.stroke} strokeWidth={s.sw}
          transform={`rotate(${s.rot.toFixed(1)} ${s.cx.toFixed(1)} ${s.cy.toFixed(1)})`} />
      );
    case "rect": {
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
      return (
        <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} fill={s.fill} opacity={s.opacity} stroke={s.stroke} strokeWidth={s.sw}
          transform={`rotate(${s.rot.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})`} />
      );
    }
    case "path":
      return <path key={i} d={s.d} fill={s.fill ?? "none"} stroke={s.stroke} strokeWidth={s.sw} strokeLinecap="round" opacity={s.opacity} />;
  }
}

/**
 * Preppy's signature dish art: a top-down ceramic bowl drawn from the recipe's own ingredients.
 * Deterministic per recipe id, vector only, legible from 40px to hero size.
 */
export function BowlIllustration({ recipe, spec, size = "md", decorative, label, className }: Props) {
  const px = typeof size === "number" ? size : BOWL_SIZES[size];
  const bowl: BowlSpec =
    spec ?? (recipe ? bowlFromRecipe(recipe) : { cuisine: "other", base: "sauce", color: "#B97A4A", pieces: [], extras: [], seed: "generic" });
  const { base, shapes } = composeBowl(bowl, detailFor(px));
  const id = `bowl-${hashSeed(bowl.seed + px).toString(36)}`;
  const name = label ?? recipe?.title ?? "Dish";
  const { cx, cy, r } = INTERIOR;

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
      </defs>
      {/* contact shadow on the counter */}
      <ellipse cx="100" cy="190" rx="66" ry="6.5" fill={CERAMIC.shadow} opacity="0.06" />
      {/* vessel */}
      <circle cx={cx} cy={cy} r="93.5" fill={CERAMIC.vessel} stroke={CERAMIC.rim} strokeWidth="3.5" />
      <circle cx={cx} cy={cy} r="82" fill={CERAMIC.band} stroke={CERAMIC.bandLine} strokeWidth="1.2" />
      {/* interior */}
      <circle cx={cx} cy={cy} r={r} fill={base} />
      <g clipPath={`url(#${id}-clip)`}>
        {shapes.map(draw)}
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-depth)`} />
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={CERAMIC.shadow} strokeOpacity="0.07" strokeWidth="2" />
      {/* glaze highlight on the rim */}
      <path d="M 38 62 A 74 74 0 0 1 78 26" fill="none" stroke="#FFFDF9" strokeWidth="5" strokeLinecap="round" opacity="0.75" />
    </svg>
  );
}
