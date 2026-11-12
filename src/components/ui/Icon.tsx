import type { SVGProps } from "react";

const paths = {
  home: <path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />,
  plan: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  library: (
    <>
      <path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
      <path d="M5 17a3 3 0 0 1 3-3h10" />
    </>
  ),
  shop: (
    <>
      <path d="M5 8h14l-1 12H6z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  back: <path d="M15 5l-7 7 7 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevron: <path d="M9 5l7 7-7 7" />,
  check: <path d="M5 12l5 5 9-10" />,
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.5-4.5" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
  flame: <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" />,
  alert: (
    <>
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4M12 17v.5" />
    </>
  ),
  /* Pantry levels: the same jar, full, low, empty. */
  jarFull: (
    <>
      <path d="M8 3.5h8M5 7h14v11.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18.5z" />
      <path d="M6.2 10.5h11.6v8a1.6 1.6 0 0 1-1.6 1.6H7.8a1.6 1.6 0 0 1-1.6-1.6z" fill="currentColor" stroke="none" />
    </>
  ),
  jarLow: (
    <>
      <path d="M8 3.5h8M5 7h14v11.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18.5z" />
      <path d="M6.2 16.5h11.6v2a1.6 1.6 0 0 1-1.6 1.6H7.8a1.6 1.6 0 0 1-1.6-1.6z" fill="currentColor" stroke="none" />
    </>
  ),
  jarEmpty: <path d="M8 3.5h8M5 7h14v11.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18.5z" />,
  /* Pantry items, by how they're kept. */
  bag: (
    <>
      <path d="M7 6l1.5-3h7L17 6" />
      <path d="M6 6h12l1 13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
      <path d="M9.5 11.5h5" />
    </>
  ),
  tin: (
    <>
      <ellipse cx="12" cy="6" rx="6" ry="2.2" />
      <path d="M6 6v12c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2V6" />
      <path d="M6 10.5c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2" />
    </>
  ),
  cube: (
    <>
      <path d="M12 3.5l7.5 4v9L12 20.5l-7.5-4v-9z" />
      <path d="M4.5 7.5L12 11.5l7.5-4M12 11.5v9" />
    </>
  ),
  pot: (
    <>
      <path d="M7 4h10v3H7z" />
      <path d="M6 7h12v11a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" />
      <path d="M9 12h6" />
    </>
  ),
  /* Shopping groups. */
  produce: (
    <>
      <path d="M5 19C5 10 11 5 19 5c0 8-5 14-14 14z" />
      <path d="M5 19l8-8" />
    </>
  ),
  protein: (
    <>
      <path d="M14.5 4.5a5 5 0 0 1 5 5c0 3-3 5.5-6.5 5.5l-3.5 3.5" />
      <path d="M14.5 4.5c-3 0-5.5 3-5.5 6.5L5.5 14.5" />
      <circle cx="5" cy="19" r="1.6" />
      <circle cx="4.8" cy="14.8" r="1.4" />
    </>
  ),
  dairy: (
    <>
      <path d="M8 3h8v3l2 3v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9l2-3z" />
      <path d="M6 12h12" />
    </>
  ),
  carbs: (
    <>
      <path d="M12 21V8" />
      <path d="M12 8c-2.5 0-4-2-4-5 2.5 0 4 2 4 5zM12 8c2.5 0 4-2 4-5-2.5 0-4 2-4 5z" />
      <path d="M12 14c-2.5 0-4-2-4-4.5 2.5 0 4 2 4 4.5zM12 14c2.5 0 4-2 4-4.5-2.5 0-4 2-4 4.5z" />
    </>
  ),
  oil: <path d="M12 3c3 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-6.5 6-11z" />,
  baking: (
    <>
      <path d="M5 12h14l-1.5 8h-11z" />
      <path d="M6 12a6 4 0 0 1 12 0" />
      <path d="M12 8V5" />
    </>
  ),
  spices: (
    <>
      <path d="M8 9h8v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      <path d="M11 5.5h.01M13 5.5h.01M12 4h.01" />
    </>
  ),
  sauces: (
    <>
      <path d="M10 3h4v4l2 3v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10l2-3z" />
      <path d="M8 14h8" />
    </>
  ),
  other: (
    <>
      <path d="M4 8l8-4 8 4v8l-8 4-8-4z" />
      <path d="M4 8l8 4 8-4M12 12v8" />
    </>
  ),
} as const;

export type IconName = keyof typeof paths;

type IconProps = SVGProps<SVGSVGElement> & { name: IconName; size?: number };

/** Stroke icon set. Decorative by default; pass aria-label to make it meaningful. */
export function Icon({ name, size = 24, strokeWidth = 1.8, ...rest }: IconProps) {
  const labelled = Boolean(rest["aria-label"]);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={labelled ? undefined : true}
      role={labelled ? "img" : undefined}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
