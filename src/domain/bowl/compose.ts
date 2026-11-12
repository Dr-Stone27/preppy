import { DRY, FOOD, RICE, shade } from "./palette";
import { rng } from "./seed";
import type { BowlSpec, Detail, ExtraType, PieceType, RiceStyle, Shape } from "./types";

/** Bowl interior, in the 200×200 viewBox. Everything is clipped to this circle. */
export const INTERIOR = { cx: 100, cy: 98, r: 74 } as const;

/** Where the rice sits when a dish is served over rice: a mound on the left, the sauce on the right. */
const RICE_SIDE = { cx: INTERIOR.cx - 40, cy: INTERIOR.cy + 2, r: 50 } as const;

type Rand = ReturnType<typeof rng>;
type Pt = { x: number; y: number; size: number };
type Region = (x: number, y: number, size: number) => boolean;

const rad = (deg: number) => (deg * Math.PI) / 180;
/** A point offset from p by (lx, ly) in the piece's own rotated frame. */
function at(p: { x: number; y: number }, lx: number, ly: number, deg: number) {
  const a = rad(deg);
  return { x: p.x + lx * Math.cos(a) - ly * Math.sin(a), y: p.y + lx * Math.sin(a) + ly * Math.cos(a) };
}
const line = (a: { x: number; y: number }, b: { x: number; y: number }) => `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} L ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;

const inBowl =
  (reach = 0.84): Region =>
  (x, y, size) =>
    Math.hypot(x - INTERIOR.cx, y - INTERIOR.cy) <= INTERIOR.r * reach - size / 2;
const inCircle =
  (c: { cx: number; cy: number; r: number }): Region =>
  (x, y, size) =>
    Math.hypot(x - c.cx, y - c.cy) <= c.r - size / 2;
const outside = (c: { cx: number; cy: number; r: number }, region: Region): Region => (x, y, size) =>
  region(x, y, size) && Math.hypot(x - c.cx, y - c.cy) >= c.r + size * 0.25;

/** Place n points inside a region, keeping them apart from each other and from anything placed earlier. */
function scatter(rand: Rand, n: number, size: number, placed: Pt[], region: Region, spacing = 0.55): Pt[] {
  const out: Pt[] = [];
  for (let i = 0, tries = 0; i < n && tries < n * 80; tries++) {
    const a = rand.range(0, Math.PI * 2);
    const d = Math.sqrt(rand.next()) * INTERIOR.r;
    const p = { x: INTERIOR.cx + Math.cos(a) * d, y: INTERIOR.cy + Math.sin(a) * d, size };
    if (!region(p.x, p.y, size)) continue;
    if ([...placed, ...out].every((q) => Math.hypot(q.x - p.x, q.y - p.y) > (q.size + p.size) * spacing)) {
      out.push(p);
      i++;
    }
  }
  placed.push(...out);
  return out;
}

/** Points spread over a region with no spacing checks, for textures (grains, curds, crumbs). */
function sprinkle(rand: Rand, n: number, region: Region) {
  const out: { x: number; y: number }[] = [];
  for (let tries = 0; out.length < n && tries < n * 20; tries++) {
    const a = rand.range(0, Math.PI * 2);
    const d = Math.sqrt(rand.next()) * INTERIOR.r;
    const p = { x: INTERIOR.cx + Math.cos(a) * d, y: INTERIOR.cy + Math.sin(a) * d };
    if (region(p.x, p.y, 0)) out.push(p);
  }
  return out;
}

const level = (d: Detail) => (d === "high" ? 0 : d === "mid" ? 1 : 2);
const pick = (d: Detail, n: [number, number, number]) => n[level(d)];

/* ---------- Fillings ---------- */

function blobs(s: Shape[], rand: Rand, region: Region, n: number, color: string, tone: number, op: number, rMin: number, rMax: number) {
  for (const p of sprinkle(rand, n, region)) {
    s.push({ kind: "ellipse", cx: p.x, cy: p.y, rx: rand.range(rMin, rMax), ry: rand.range(rMin * 0.6, rMax * 0.8), rot: rand.range(0, 180), fill: shade(color, tone), opacity: op });
  }
}

function rice(s: Shape[], rand: Rand, style: RiceStyle, region: Region, detail: Detail, scale = 1) {
  const c = RICE[style];
  blobs(s, rand, region, 4, c.base, -0.12, 0.35, 14, 26);
  blobs(s, rand, region, 4, c.base, 0.16, 0.45, 9, 16);
  const n = Math.round(pick(detail, [110, 46, 0]) * scale);
  for (const p of sprinkle(rand, n, region)) {
    const dark = rand.next() < (style === "white" ? 0.35 : style === "jollof" ? 0.16 : 0.1);
    const rot = rand.range(0, 180);
    // A faint shadow under each grain so white rice reads as grains, not a flat cream.
    if (style === "white") s.push({ kind: "ellipse", cx: p.x + 0.6, cy: p.y + 0.8, rx: 3.2, ry: 1.4, rot, fill: c.dark, opacity: 0.7 });
    s.push({ kind: "ellipse", cx: p.x, cy: p.y, rx: 3, ry: 1.25, rot, fill: dark ? c.dark : c.grain, opacity: 0.95 });
  }
}

function sauce(s: Shape[], rand: Rand, color: string, region: Region, detail: Detail, oil?: boolean) {
  if (color === DRY) {
    // A dry bed: faint creases rather than a glossy sauce.
    blobs(s, rand, region, 5, color, -0.06, 0.5, 14, 24);
    return;
  }
  blobs(s, rand, region, 3, color, -0.18, 0.35, 16, 28);
  blobs(s, rand, region, 5, color, 0.22, 0.45, 8, 16);
  // Glossy streaks: what makes a stew read as a sauce at a glance.
  for (const p of sprinkle(rand, pick(detail, [5, 3, 2]), region)) {
    const r = rand.range(-30, 30);
    s.push({ kind: "path", d: line(at(p, -9, 0, r), at(p, 9, 0, r)), stroke: shade(color, 0.45), sw: 2.4, opacity: 0.45 });
  }
  if (oil) for (const p of sprinkle(rand, pick(detail, [12, 7, 3]), region)) s.push({ kind: "circle", cx: p.x, cy: p.y, r: rand.range(1.6, 4.2), fill: FOOD.oil, opacity: 0.42 });
}

function soup(s: Shape[], rand: Rand, spec: BowlSpec, detail: Detail) {
  const { cx, cy } = INTERIOR;
  const all = inBowl(0.98);
  if (spec.soup === "greens") {
    // Efo: a bowl of leaves in red oil.
    blobs(s, rand, all, 4, spec.color, -0.2, 0.4, 16, 26);
    for (const p of sprinkle(rand, pick(detail, [70, 36, 16]), all)) {
      const rot = rand.range(0, 180);
      s.push({ kind: "ellipse", cx: p.x, cy: p.y, rx: rand.range(5, 9), ry: rand.range(2.4, 4), rot, fill: rand.next() > 0.5 ? FOOD.leafLight : shade(spec.color, -0.15), opacity: 0.9 });
    }
  } else if (spec.soup === "egusi") {
    // Egusi: soft golden curds with leaves through it.
    blobs(s, rand, all, 3, spec.color, -0.15, 0.4, 16, 26);
    for (const p of sprinkle(rand, pick(detail, [60, 30, 14]), all)) {
      s.push({ kind: "circle", cx: p.x, cy: p.y, r: rand.range(2.5, 6), fill: shade(spec.color, rand.next() > 0.5 ? 0.45 : 0.25), opacity: 0.9 });
    }
  } else {
    // Clear broth: rings, a sheen and fat droplets.
    for (const r of [24, 42, 60]) s.push({ kind: "circle", cx: cx + rand.range(-4, 4), cy: cy + rand.range(-4, 4), r, fill: "none", stroke: shade(spec.color, 0.3), sw: 2, opacity: 0.35 });
    for (const p of sprinkle(rand, pick(detail, [18, 9, 4]), all)) s.push({ kind: "circle", cx: p.x, cy: p.y, r: rand.range(1.6, 3.8), fill: shade(spec.color, 0.55), opacity: 0.55 });
  }
  if (spec.oil) for (const p of sprinkle(rand, pick(detail, [12, 7, 3]), all)) s.push({ kind: "circle", cx: p.x, cy: p.y, r: rand.range(1.6, 4), fill: FOOD.oil, opacity: 0.45 });
}

function beans(s: Shape[], rand: Rand, color: string, detail: Detail) {
  const all = inBowl(0.98);
  blobs(s, rand, all, 3, color, -0.12, 0.35, 16, 26);
  for (const p of sprinkle(rand, pick(detail, [70, 36, 16]), all)) {
    const rot = rand.range(0, 180);
    s.push({ kind: "ellipse", cx: p.x, cy: p.y, rx: 6, ry: 3.8, rot, fill: shade(color, -0.32), opacity: 0.95 });
    if (detail !== "low") s.push({ kind: "ellipse", cx: p.x - 1.2, cy: p.y - 1, rx: 2.4, ry: 1.2, rot, fill: shade(color, 0.25), opacity: 0.6 });
  }
}

function noodles(s: Shape[], rand: Rand, color: string, detail: Detail) {
  const { cx, cy } = INTERIOR;
  // Jollof spaghetti is tomato-red all through; plain noodles are cream.
  const strand = shade(color, 0.3);
  const n = pick(detail, [16, 11, 6]);
  // Tangled strands: each one a loose S-curve across the bowl at its own angle.
  for (let i = 0; i < n; i++) {
    const a = rand.range(0, 180);
    const o = { x: cx + rand.range(-20, 20), y: cy + rand.range(-20, 20) };
    const p0 = at(o, -80, rand.range(-30, 30), a), p3 = at(o, 80, rand.range(-30, 30), a);
    const c1 = at(o, -25, rand.range(-55, 55), a), c2 = at(o, 25, rand.range(-55, 55), a);
    const d = `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)}, ${c2.x.toFixed(2)} ${c2.y.toFixed(2)}, ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`;
    s.push({ kind: "path", d, stroke: shade(color, -0.3), sw: 6.5, opacity: 0.35 });
    s.push({ kind: "path", d, stroke: strand, sw: 4, opacity: 0.95 });
  }
}

/* ---------- Sweet dishes: each has its own shape ---------- */

function sweet(s: Shape[], rand: Rand, spec: BowlSpec, detail: Detail, placed: Pt[]): Region {
  const { cx, cy } = INTERIOR;
  const c = spec.color;
  const all = inBowl(0.98);
  switch (spec.base) {
    case "pancakes": {
      for (const [dx, dy, r] of [[8, 10, 48], [2, 4, 46], [-4, -3, 44]] as const) {
        s.push({ kind: "circle", cx: cx + dx, cy: cy + dy, r, fill: "#D9A25A", stroke: "#A8703A", sw: 2 });
      }
      s.push({ kind: "circle", cx: cx - 4, cy: cy - 3, r: 36, fill: "#E7B970", opacity: 0.7 });
      s.push({ kind: "path", d: `M ${cx - 30} ${cy - 16} C ${cx - 10} ${cy - 30}, ${cx + 14} ${cy + 4}, ${cx + 30} ${cy - 12}`, stroke: "#9A5A22", sw: 5, opacity: 0.75 });
      placed.push({ x: cx - 4, y: cy - 3, size: 30 });
      return inCircle({ cx: cx - 4, cy: cy - 3, r: 38 });
    }
    case "flan": {
      s.push({ kind: "circle", cx, cy: cy + 3, r: 50, fill: shade(c, -0.08), stroke: shade(c, -0.25), sw: 2 });
      s.push({ kind: "circle", cx, cy: cy + 1, r: 40, fill: "#A85E24" });
      s.push({ kind: "path", d: `M ${cx - 26} ${cy - 18} A 34 34 0 0 1 ${cx + 6} ${cy - 32}`, stroke: "#E9A55A", sw: 4, opacity: 0.7 });
      return all;
    }
    case "mousse": {
      let d = `M ${cx} ${cy}`;
      for (let i = 1; i <= 26; i++) {
        const a = i * 0.62, r = i * 2.4;
        d += ` L ${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}`;
      }
      s.push({ kind: "path", d, stroke: shade(c, 0.28), sw: 5, opacity: 0.7 });
      return all;
    }
    case "cake": {
      // Crackled top of a brownie or mug cake.
      blobs(s, rand, all, 4, c, -0.15, 0.5, 14, 24);
      for (let i = 0; i < pick(detail, [9, 6, 3]); i++) {
        const p = sprinkle(rand, 1, inBowl(0.7))[0];
        const r = rand.range(0, 180);
        s.push({ kind: "path", d: `${line(at(p, -12, 0, r), at(p, 0, 3, r))} L ${at(p, 12, -2, r).x.toFixed(2)} ${at(p, 12, -2, r).y.toFixed(2)}`, stroke: shade(c, 0.35), sw: 1.8, opacity: 0.7 });
      }
      return all;
    }
    case "loaf": {
      for (const [dx, r] of [[-20, -8], [22, 6]] as const) {
        const p = { x: cx + dx, y: cy };
        s.push({ kind: "rect", x: p.x - 22, y: p.y - 34, w: 44, h: 68, r: 10, rot: r, fill: "#7A4A26" });
        s.push({ kind: "rect", x: p.x - 18, y: p.y - 30, w: 36, h: 60, r: 8, rot: r, fill: "#D6A262" });
        if (detail !== "low") for (const q of sprinkle(rand, 7, inCircle({ cx: p.x, cy: p.y, r: 22 }))) s.push({ kind: "circle", cx: q.x, cy: q.y, r: 1.4, fill: "#5B3A2E", opacity: 0.7 });
      }
      return () => false;
    }
    case "toast": {
      s.push({ kind: "rect", x: cx - 40, y: cy - 38, w: 80, h: 76, r: 14, rot: -8, fill: "#A8703A" });
      s.push({ kind: "rect", x: cx - 34, y: cy - 32, w: 68, h: 64, r: 10, rot: -8, fill: "#E2B470" });
      s.push({ kind: "circle", cx, cy, r: 22, fill: "#F2D88A" });
      for (const p of sprinkle(rand, pick(detail, [14, 8, 0]), inCircle({ cx, cy, r: 30 }))) s.push({ kind: "circle", cx: p.x, cy: p.y, r: 1.2, fill: "#8A5A2B", opacity: 0.7 });
      return inCircle({ cx, cy, r: 30 });
    }
    case "moimoi": {
      // Moi moi in its leaf: an orange dome on green.
      for (const p of sprinkle(rand, pick(detail, [8, 5, 3]), all)) s.push({ kind: "path", d: line(at(p, -16, 0, 40), at(p, 16, 0, 40)), stroke: shade("#5E7F45", 0.3), sw: 1.6, opacity: 0.6 });
      s.push({ kind: "circle", cx, cy: cy + 3, r: 46, fill: "#B65630" });
      s.push({ kind: "circle", cx: cx - 2, cy, r: 41, fill: c });
      s.push({ kind: "ellipse", cx: cx - 12, cy: cy - 12, rx: 18, ry: 10, rot: -30, fill: shade(c, 0.3), opacity: 0.7 });
      for (const p of sprinkle(rand, pick(detail, [10, 6, 0]), inCircle({ cx, cy, r: 34 }))) s.push({ kind: "circle", cx: p.x, cy: p.y, r: 1.3, fill: shade(c, -0.4), opacity: 0.6 });
      return () => false;
    }
    case "akara": {
      // Akara balls beside a pool of pap.
      const pap = { cx: cx - 34, cy: cy + 4, r: 44 };
      s.push({ kind: "circle", cx: pap.cx, cy: pap.cy, r: pap.r, fill: "#EFE0BE" });
      s.push({ kind: "path", d: `M ${pap.cx - 24} ${pap.cy - 18} A 30 30 0 0 1 ${pap.cx + 4} ${pap.cy - 30}`, stroke: "#FFF8EA", sw: 4, opacity: 0.8 });
      for (const p of scatter(rand, pick(detail, [6, 5, 3]), 26, placed, outside(pap, inBowl(0.9)), 0.48)) {
        s.push({ kind: "circle", cx: p.x, cy: p.y, r: 13, fill: "#B8742E", stroke: "#7E4A1C", sw: 1.4 });
        s.push({ kind: "circle", cx: p.x - 4, cy: p.y - 4, r: 5, fill: "#D9963E", opacity: 0.8 });
        if (detail !== "low") for (let i = 0; i < 4; i++) s.push({ kind: "circle", cx: p.x + rand.range(-8, 8), cy: p.y + rand.range(-8, 8), r: 1.1, fill: "#5E3412", opacity: 0.7 });
      }
      return () => false;
    }
    case "oats": {
      s.push({ kind: "circle", cx, cy, r: 64, fill: "none", stroke: shade(c, 0.5), sw: 6, opacity: 0.45 });
      for (const p of sprinkle(rand, pick(detail, [44, 22, 8]), inBowl(0.85))) s.push({ kind: "ellipse", cx: p.x, cy: p.y, rx: 4.2, ry: 2.6, rot: rand.range(0, 180), fill: "#F1E6C8", opacity: 0.95 });
      return inBowl(0.8);
    }
    default: {
      s.push({ kind: "circle", cx, cy, r: 30, fill: shade(c, -0.28), opacity: 0.5 });
      s.push({ kind: "path", d: `M ${cx - 48} ${cy - 24} A 54 54 0 0 1 ${cx + 6} ${cy - 54}`, stroke: shade(c, 0.45), sw: 5, opacity: 0.6 });
      return inBowl(0.8);
    }
  }
}

/* ---------- Pieces ---------- */

// [high, mid, low], then the footprint used to keep pieces apart.
const PIECE: Record<PieceType, { n: [number, number, number]; size: number }> = {
  chicken: { n: [3, 3, 2], size: 40 },
  "chicken-strips": { n: [7, 5, 3], size: 22 },
  "chicken-bites": { n: [9, 7, 4], size: 15 },
  wings: { n: [3, 3, 2], size: 34 },
  gizzard: { n: [10, 7, 4], size: 12 },
  beef: { n: [7, 5, 4], size: 17 },
  "beef-strips": { n: [8, 6, 3], size: 20 },
  mince: { n: [10, 7, 4], size: 13 },
  ribs: { n: [3, 3, 2], size: 40 },
  goat: { n: [6, 5, 3], size: 19 },
  plantain: { n: [5, 4, 3], size: 20 },
  yam: { n: [5, 4, 2], size: 19 },
  beans: { n: [10, 7, 4], size: 9 },
  banana: { n: [5, 4, 2], size: 18 },
  choc: { n: [5, 4, 3], size: 12 },
  peanuts: { n: [8, 6, 0], size: 9 },
};

function piece(type: PieceType, p: Pt, rand: Rand, spec: BowlSpec, detail: Detail): Shape[] {
  const r = rand.range(-70, 70);
  const fine = detail !== "low";
  switch (type) {
    case "chicken": {
      // A seared drumstick: golden body, sear marks, a bone end.
      const c = FOOD.chicken;
      const neck = at(p, 11, 0, r), bone = at(p, 20, 0, r), k1 = at(p, 26, -2.6, r), k2 = at(p, 26, 2.6, r);
      return [
        { kind: "rect", x: bone.x - 7, y: bone.y - 2.8, w: 14, h: 5.6, r: 2.8, rot: r, fill: FOOD.bone, stroke: "#DCCBAE", sw: 0.8 },
        { kind: "circle", cx: k1.x, cy: k1.y, r: 3.4, fill: FOOD.bone, stroke: "#DCCBAE", sw: 0.8 },
        { kind: "circle", cx: k2.x, cy: k2.y, r: 3.4, fill: FOOD.bone, stroke: "#DCCBAE", sw: 0.8 },
        // Teardrop: a round end tapering into the bone.
        { kind: "ellipse", cx: neck.x, cy: neck.y, rx: 9, ry: 7, rot: r, fill: c.fill, stroke: c.lo, sw: 1.2 },
        { kind: "ellipse", cx: p.x, cy: p.y, rx: 16, ry: 13, rot: r, fill: c.fill, stroke: c.lo, sw: 1.2 },
        { kind: "ellipse", cx: neck.x, cy: neck.y, rx: 8, ry: 6, rot: r, fill: c.fill, bare: true },
        { kind: "ellipse", cx: at(p, -3, -5, r).x, cy: at(p, -3, -5, r).y, rx: 9, ry: 4.5, rot: r, fill: c.hi, opacity: 0.8 },
        ...(fine ? ([{ kind: "ellipse", cx: at(p, 2, 5, r).x, cy: at(p, 2, 5, r).y, rx: 7, ry: 3, rot: r, fill: c.lo, opacity: 0.35 }] as Shape[]) : []),
      ];
    }
    case "chicken-strips": {
      // Shawarma and fajita strips are charred and golden; plain sliced breast is paler.
      const c = /shawarma|fajita/.test(spec.seed) || spec.color !== DRY ? FOOD.chicken : FOOD.chickenPale;
      return [
        { kind: "rect", x: p.x - 13, y: p.y - 4.5, w: 26, h: 9, r: 4.5, rot: r, fill: c.fill, stroke: c.lo, sw: 0.8 },
        { kind: "path", d: line(at(p, -9, -1.5, r), at(p, 9, -1.5, r)), stroke: c.hi, sw: 1.8, opacity: 0.75 },
      ];
    }
    case "chicken-bites": {
      // Glazed in the dish's own sauce when it has one.
      const glaze = spec.base !== "sauce" || spec.color === DRY ? FOOD.chicken.fill : shade(spec.color, -0.1);
      return [
        { kind: "rect", x: p.x - 6.5, y: p.y - 6, w: 13, h: 12, r: 4.5, rot: r, fill: glaze, stroke: shade(glaze, -0.35), sw: 1 },
        { kind: "circle", cx: p.x - 2, cy: p.y - 2.5, r: 2.2, fill: shade(glaze, 0.5), opacity: 0.8 },
      ];
    }
    case "wings": {
      const c = FOOD.wings, tip = at(p, 14, 5, r);
      return [
        { kind: "ellipse", cx: tip.x, cy: tip.y, rx: 9, ry: 6, rot: r + 35, fill: c.fill, stroke: c.lo, sw: 1.1 },
        { kind: "ellipse", cx: p.x, cy: p.y, rx: 13, ry: 8.5, rot: r, fill: c.fill, stroke: c.lo, sw: 1.1 },
        { kind: "ellipse", cx: at(p, -2, -3, r).x, cy: at(p, -2, -3, r).y, rx: 7, ry: 3, rot: r, fill: c.hi, opacity: 0.7 },
      ];
    }
    case "gizzard":
      return [
        { kind: "ellipse", cx: p.x, cy: p.y, rx: 6.2, ry: 4.6, rot: r, fill: FOOD.gizzard.fill },
        { kind: "ellipse", cx: p.x - 1.5, cy: p.y - 1.2, rx: 2.6, ry: 1.4, rot: r, fill: FOOD.gizzard.hi, opacity: 0.8 },
      ];
    case "beef": {
      const c = FOOD.beef;
      return [
        { kind: "rect", x: p.x - 7.5, y: p.y - 6.5, w: 15, h: 13, r: 4, rot: r, fill: c.fill, stroke: c.lo, sw: 0.8 },
        { kind: "rect", x: p.x - 5, y: p.y - 4.5, w: 6, h: 3, r: 1.5, rot: r, fill: c.hi, opacity: 0.8 },
      ];
    }
    case "beef-strips": {
      const c = FOOD.beef;
      return [
        { kind: "rect", x: p.x - 12, y: p.y - 3.4, w: 24, h: 6.8, r: 3.4, rot: r, fill: c.fill },
        { kind: "path", d: line(at(p, -8, -1, r), at(p, 8, -1, r)), stroke: c.hi, sw: 1.4, opacity: 0.8 },
      ];
    }
    case "mince": {
      // Crumbles: a loose cluster rather than a cube.
      const c = FOOD.beef;
      return Array.from({ length: fine ? 6 : 3 }, (_, i) => ({
        kind: "circle" as const,
        cx: p.x + rand.range(-5, 5),
        cy: p.y + rand.range(-5, 5),
        r: rand.range(2, 3.3),
        fill: i % 2 ? c.hi : c.fill,
      }));
    }
    case "ribs": {
      const c = FOOD.beef, a = at(p, -18, 0, r), b = at(p, 18, 0, r);
      return [
        { kind: "circle", cx: a.x, cy: a.y, r: 3.6, fill: FOOD.bone },
        { kind: "circle", cx: b.x, cy: b.y, r: 3.6, fill: FOOD.bone },
        { kind: "rect", x: p.x - 16, y: p.y - 6.5, w: 32, h: 13, r: 6, rot: r, fill: "#6A2716", stroke: "#3E150A", sw: 1 },
        { kind: "path", d: line(at(p, -11, -2.5, r), at(p, 11, -2.5, r)), stroke: c.hi, sw: 2, opacity: 0.7 },
      ];
    }
    case "goat": {
      const c = FOOD.goat, b = at(p, 4, 3, r);
      return [
        { kind: "rect", x: p.x - 8.5, y: p.y - 7.5, w: 17, h: 15, r: 5, rot: r, fill: c.fill, stroke: c.lo, sw: 0.8 },
        { kind: "circle", cx: b.x, cy: b.y, r: 2.6, fill: FOOD.bone, stroke: "#D9C9A8", sw: 0.8 },
      ];
    }
    case "plantain": {
      // Dodo: a golden diagonal slice with caramelised edges.
      const c = FOOD.plantain;
      return [
        { kind: "ellipse", cx: p.x, cy: p.y, rx: 10.5, ry: 6.8, rot: r, fill: c.fill, stroke: c.lo, sw: 1.8 },
        { kind: "ellipse", cx: p.x - 1, cy: p.y - 1, rx: 5.5, ry: 2.8, rot: r, fill: c.hi, opacity: 0.8 },
      ];
    }
    case "yam": {
      const fill = spec.base === "porridge" ? shade(spec.color, 0.42) : FOOD.yam.fill;
      return [{ kind: "rect", x: p.x - 9, y: p.y - 8, w: 18, h: 16, r: 4.5, rot: r, fill, stroke: shade(fill, -0.18), sw: 1.4 }];
    }
    case "beans":
      return [{ kind: "ellipse", cx: p.x, cy: p.y, rx: 3.6, ry: 5.6, rot: r, fill: FOOD.bean }];
    case "banana":
      return [
        { kind: "circle", cx: p.x, cy: p.y, r: 8.5, fill: FOOD.banana.fill, stroke: FOOD.banana.lo, sw: 1.4 },
        ...(fine ? ([0, 120, 240].map((a) => ({ kind: "circle", cx: at(p, 2.6, 0, a).x, cy: at(p, 2.6, 0, a).y, r: 0.9, fill: "#8A6A3A", opacity: 0.6 })) as Shape[]) : []),
      ];
    case "choc":
      return [{ kind: "rect", x: p.x - 5.5, y: p.y - 5.5, w: 11, h: 11, r: 1.8, rot: r, fill: FOOD.choc }];
    case "peanuts":
      return [
        { kind: "ellipse", cx: p.x, cy: p.y, rx: 4.6, ry: 3.2, rot: r, fill: FOOD.peanut.fill },
        { kind: "path", d: line(at(p, 0, -3, r), at(p, 0, 3, r)), stroke: FOOD.peanut.lo, sw: 0.8, opacity: 0.7 },
      ];
  }
}

/* ---------- Extras ---------- */

const EXTRA: Record<ExtraType, { n: [number, number, number]; size: number }> = {
  "peas-carrot": { n: [16, 10, 4], size: 5 },
  "spring-onion": { n: [10, 6, 0], size: 6 },
  sesame: { n: [22, 12, 0], size: 2 },
  cucumber: { n: [4, 3, 2], size: 17 },
  pepper: { n: [6, 4, 2], size: 11 },
  greens: { n: [6, 4, 2], size: 13 },
  chilli: { n: [6, 4, 2], size: 9 },
  lime: { n: [1, 1, 1], size: 22 },
  cabbage: { n: [7, 4, 0], size: 11 },
  drizzle: { n: [1, 1, 1], size: 0 },
};

function extra(type: ExtraType, p: Pt, rand: Rand, i: number): Shape[] {
  const r = rand.range(0, 180);
  switch (type) {
    case "peas-carrot":
      return i % 3 === 2
        ? [{ kind: "rect", x: p.x - 2.4, y: p.y - 2.4, w: 4.8, h: 4.8, r: 1, rot: r, fill: FOOD.carrot }]
        : [{ kind: "circle", cx: p.x, cy: p.y, r: 2.7, fill: FOOD.pea, stroke: shade(FOOD.pea, -0.25), sw: 0.6 }];
    case "spring-onion":
      return [{ kind: "circle", cx: p.x, cy: p.y, r: 2.6, fill: "none", stroke: FOOD.leafLight, sw: 1.7 }];
    case "sesame":
      return [{ kind: "ellipse", cx: p.x, cy: p.y, rx: 1.7, ry: 0.9, rot: r, fill: FOOD.sesame }];
    case "cucumber":
      return [
        { kind: "circle", cx: p.x, cy: p.y, r: 8, fill: FOOD.cucumber.fill, stroke: FOOD.cucumber.rim, sw: 1.8 },
        { kind: "circle", cx: p.x, cy: p.y, r: 3.2, fill: shade(FOOD.cucumber.fill, 0.4) },
      ];
    case "pepper": {
      const a = at(p, -6, 0, r), b = at(p, 6, 0, r);
      return [{ kind: "path", d: `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A 7 7 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`, stroke: i % 2 ? FOOD.pepperGreen : FOOD.pepperRed, sw: 3 }];
    }
    case "greens":
      return [
        { kind: "ellipse", cx: p.x, cy: p.y, rx: 7.5, ry: 3.8, rot: r, fill: FOOD.leaf },
        { kind: "path", d: line(at(p, -5, 0, r), at(p, 5, 0, r)), stroke: FOOD.leafLight, sw: 1, opacity: 0.9 },
      ];
    case "chilli":
      return [{ kind: "ellipse", cx: p.x, cy: p.y, rx: 5, ry: 2, rot: r, fill: FOOD.chilli }];
    case "lime": {
      const a = at(p, -10, 0, r), b = at(p, 10, 0, r);
      return [
        { kind: "path", d: `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A 10 10 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)} Z`, fill: FOOD.lime.fill, stroke: FOOD.lime.rind, sw: 2.2 },
      ];
    }
    case "cabbage": {
      const a = at(p, -6, 0, r), b = at(p, 6, 0, r);
      return [{ kind: "path", d: `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} Q ${p.x.toFixed(2)} ${(p.y - 4).toFixed(2)} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`, stroke: FOOD.cabbage, sw: 2.2 }];
    }
    case "drizzle":
      return [];
  }
}

/* ---------- Assembly ---------- */

/** The colour behind everything, before any texture. */
function baseFill(spec: BowlSpec): string {
  if (spec.base === "rice") return RICE[spec.rice ?? "white"].base;
  if (spec.base === "pancakes" || spec.base === "toast" || spec.base === "loaf") return "#EEDDBE";
  if (spec.base === "flan") return "#B9702E";
  if (spec.base === "moimoi") return "#5E7F45";
  if (spec.base === "akara") return DRY;
  return spec.color;
}

/** Pure: same spec + detail → same shapes. Rendering lives in BowlIllustration. */
export function composeBowl(spec: BowlSpec, detail: Detail): { base: string; shapes: Shape[] } {
  const rand = rng(spec.seed);
  const s: Shape[] = [];
  const placed: Pt[] = [];
  const all = inBowl(0.98);
  let pieceRegion: Region = inBowl();
  let scale = 1;

  switch (spec.base) {
    case "rice":
      rice(s, rand, spec.rice ?? "white", all, detail);
      break;
    case "sauce":
      sauce(s, rand, spec.color, all, detail, spec.oil);
      if (spec.split) {
        s.push({ kind: "circle", cx: RICE_SIDE.cx + 2, cy: RICE_SIDE.cy + 3, r: RICE_SIDE.r, fill: shade(spec.color, -0.35), opacity: 0.35 });
        s.push({ kind: "circle", cx: RICE_SIDE.cx, cy: RICE_SIDE.cy, r: RICE_SIDE.r, fill: RICE[spec.rice ?? "white"].base });
        rice(s, rand, spec.rice ?? "white", inCircle(RICE_SIDE), detail, 0.55);
        pieceRegion = outside(RICE_SIDE, inBowl());
        scale = 0.65;
      }
      break;
    case "soup":
      soup(s, rand, spec, detail);
      break;
    case "porridge":
      sauce(s, rand, spec.color, all, detail, spec.oil);
      for (const p of scatter(rand, pick(detail, [9, 7, 4]), 19, placed, inBowl())) s.push(...piece("yam", p, rand, spec, detail).map((sh) => ({ ...sh, lift: true })));
      break;
    case "beans":
      beans(s, rand, spec.color, detail);
      break;
    case "noodles":
      noodles(s, rand, spec.color, detail);
      break;
    default:
      pieceRegion = sweet(s, rand, spec, detail, placed);
  }

  // Big pieces first so small ones fill around them.
  const order = [...spec.pieces].sort((a, b) => PIECE[b].size - PIECE[a].size);
  for (const t of order) {
    const n = Math.max(1, Math.round(pick(detail, PIECE[t].n) * scale));
    for (const p of scatter(rand, n, PIECE[t].size, placed, pieceRegion)) s.push(...piece(t, p, rand, spec, detail).map((sh) => ({ ...sh, lift: true })));
  }

  for (const t of spec.extras) {
    if (t === "drizzle") {
      const c = spec.base === "oats" ? "#8A5A2B" : FOOD.cream;
      const { cx, cy } = INTERIOR;
      s.push({ kind: "path", d: `M ${cx - 44} ${cy - 20} C ${cx - 20} ${cy - 40}, ${cx - 6} ${cy + 10}, ${cx + 14} ${cy - 12} S ${cx + 40} ${cy + 6}, ${cx + 50} ${cy - 16}`, stroke: c, sw: 3.4, opacity: 0.9 });
      continue;
    }
    const n = pick(detail, EXTRA[t].n);
    if (!n) continue;
    const pts = scatter(rand, n, EXTRA[t].size, placed, inBowl(0.9), EXTRA[t].size < 7 ? 0.35 : 0.55);
    // Big extras (cucumber, lime) sit on top like pieces; seeds and peas stay flat.
    pts.forEach((p, i) => s.push(...extra(t, p, rand, i).map((sh) => (EXTRA[t].size >= 11 ? { ...sh, lift: true } : sh))));
  }

  // Server and browser maths can differ in the last digit, which breaks hydration. Two places is plenty at 200×200.
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const round = (v: unknown) =>
    typeof v === "number" ? r2(v) : typeof v === "string" && v.startsWith("M ") ? v.replace(/-?\d+\.\d+/g, (m) => String(r2(Number(m)))) : v;
  return { base: baseFill(spec), shapes: s.map((sh) => Object.fromEntries(Object.entries(sh).map(([k, v]) => [k, round(v)])) as Shape) };
}

export function detailFor(px: number): Detail {
  return px < 56 ? "low" : px < 120 ? "mid" : "high";
}
