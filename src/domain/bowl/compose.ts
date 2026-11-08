import { baseColor, LEAF_LIGHT, shade, TOPPING_COLOR, YOLK } from "./palette";
import { rng } from "./seed";
import type { BaseType, BowlSpec, Detail, Shape, ToppingType } from "./types";

/** Bowl interior, in the 200×200 viewBox. Everything is clipped to this circle. */
export const INTERIOR = { cx: 100, cy: 98, r: 74 } as const;

type Rand = ReturnType<typeof rng>;
type Pt = { x: number; y: number; size: number };

/** Place n points inside the interior, keeping them apart from each other and from earlier toppings. */
function scatter(rand: Rand, n: number, size: number, placed: Pt[], reach = 0.82): Pt[] {
  const out: Pt[] = [];
  const maxR = INTERIOR.r * reach - size / 2;
  for (let i = 0, tries = 0; i < n && tries < n * 60; tries++) {
    const a = rand.range(0, Math.PI * 2);
    const d = Math.sqrt(rand.next()) * maxR;
    const p = { x: INTERIOR.cx + Math.cos(a) * d, y: INTERIOR.cy + Math.sin(a) * d, size };
    const clear = [...placed, ...out].every((q) => Math.hypot(q.x - p.x, q.y - p.y) > (q.size + p.size) * 0.55);
    if (clear) {
      out.push(p);
      i++;
    }
  }
  placed.push(...out);
  return out;
}

const COUNTS: Record<ToppingType, [number, number, number]> = {
  // [high, mid, low]
  chicken: [5, 4, 3],
  beef: [7, 5, 4],
  goat: [6, 5, 3],
  beans: [10, 7, 4],
  egg: [1, 1, 1],
  plantain: [5, 4, 3],
  yam: [4, 3, 2],
  vegetable: [6, 4, 3],
  pepper: [5, 3, 2],
  banana: [5, 4, 2],
  choc: [5, 4, 3],
  garnish: [9, 6, 0],
};

const SIZE: Record<ToppingType, number> = {
  chicken: 31,
  beef: 16,
  goat: 17,
  beans: 10,
  egg: 46,
  plantain: 18,
  yam: 19,
  vegetable: 18,
  pepper: 10,
  banana: 17,
  choc: 11,
  garnish: 5,
};

const level = (d: Detail) => (d === "high" ? 0 : d === "mid" ? 1 : 2);

function texture(base: BaseType, color: string, rand: Rand, detail: Detail): Shape[] {
  const s: Shape[] = [];
  const hi = detail === "high";
  const { cx, cy } = INTERIOR;
  const blobs = (n: number, tone: number, op: number, rMin: number, rMax: number) => {
    for (let i = 0; i < n; i++) {
      const a = rand.range(0, Math.PI * 2);
      const d = rand.range(0, 52);
      s.push({ kind: "ellipse", cx: cx + Math.cos(a) * d, cy: cy + Math.sin(a) * d, rx: rand.range(rMin, rMax), ry: rand.range(rMin * 0.6, rMax * 0.8), rot: rand.range(0, 180), fill: shade(color, tone), opacity: op });
    }
  };
  switch (base) {
    case "rice": {
      blobs(3, -0.14, 0.4, 16, 30);
      blobs(5, 0.18, 0.5, 9, 18);
      const n = hi ? 80 : detail === "mid" ? 36 : 0;
      for (let i = 0; i < n; i++) {
        const a = rand.range(0, Math.PI * 2);
        const d = Math.sqrt(rand.next()) * 70;
        s.push({ kind: "ellipse", cx: cx + Math.cos(a) * d, cy: cy + Math.sin(a) * d, rx: 2.8, ry: 1.2, rot: rand.range(0, 180), fill: shade(color, 0.42), opacity: 0.8 });
      }
      break;
    }
    case "noodles": {
      const n = hi ? 7 : detail === "mid" ? 5 : 3;
      for (let i = 0; i < n; i++) {
        const y = cy - 52 + (104 / (n - 1 || 1)) * i + rand.range(-6, 6);
        const w1 = rand.range(-22, 22), w2 = rand.range(-22, 22);
        const d = `M ${cx - 80} ${y} C ${cx - 30} ${y + w1}, ${cx + 10} ${y - w1 + w2}, ${cx + 80} ${y + w2}`;
        s.push({ kind: "path", d, stroke: shade(color, -0.25), sw: 7, opacity: 0.25 });
        s.push({ kind: "path", d, stroke: "#F7E7C0", sw: 4.5, opacity: 0.95 });
      }
      break;
    }
    case "stew": {
      blobs(3, -0.18, 0.35, 16, 28);
      blobs(6, 0.22, 0.5, 8, 18);
      if (hi) for (let i = 0; i < 16; i++) {
        const a = rand.range(0, Math.PI * 2), d = Math.sqrt(rand.next()) * 66;
        s.push({ kind: "circle", cx: cx + Math.cos(a) * d, cy: cy + Math.sin(a) * d, r: rand.range(0.9, 1.7), fill: shade(color, -0.45), opacity: 0.7 });
      }
      break;
    }
    case "soup": {
      for (const r of [22, 40, 58]) {
        s.push({ kind: "circle", cx: cx + rand.range(-4, 4), cy: cy + rand.range(-4, 4), r, fill: "none", stroke: shade(color, 0.3), sw: 2, opacity: 0.35 });
      }
      const n = hi ? 14 : 6;
      for (let i = 0; i < n; i++) {
        const a = rand.range(0, Math.PI * 2), d = Math.sqrt(rand.next()) * 62;
        s.push({ kind: "circle", cx: cx + Math.cos(a) * d, cy: cy + Math.sin(a) * d, r: rand.range(1.6, 3.6), fill: shade(color, 0.5), opacity: 0.55 });
      }
      break;
    }
    case "beans": {
      blobs(3, -0.12, 0.35, 16, 26);
      const n = hi ? 34 : detail === "mid" ? 18 : 10;
      for (let i = 0; i < n; i++) {
        const a = rand.range(0, Math.PI * 2), d = Math.sqrt(rand.next()) * 66;
        s.push({ kind: "ellipse", cx: cx + Math.cos(a) * d, cy: cy + Math.sin(a) * d, rx: 6.2, ry: 3.8, rot: rand.range(0, 180), fill: shade(color, -0.38), opacity: 0.95 });
      }
      break;
    }
    case "custard": {
      s.push({ kind: "circle", cx, cy, r: 30, fill: shade(color, -0.28), opacity: 0.5 });
      s.push({ kind: "path", d: `M ${cx - 48} ${cy - 24} A 54 54 0 0 1 ${cx + 6} ${cy - 54}`, stroke: shade(color, 0.45), sw: 5, opacity: 0.6 });
      break;
    }
    case "cake": {
      const n = hi ? 46 : detail === "mid" ? 22 : 8;
      for (let i = 0; i < n; i++) {
        const a = rand.range(0, Math.PI * 2), d = Math.sqrt(rand.next()) * 68;
        s.push({ kind: "circle", cx: cx + Math.cos(a) * d, cy: cy + Math.sin(a) * d, r: rand.range(1.2, 2.6), fill: shade(color, rand.next() > 0.5 ? -0.25 : 0.3), opacity: 0.75 });
      }
      break;
    }
    case "oats": {
      s.push({ kind: "circle", cx, cy, r: 64, fill: "none", stroke: shade(color, 0.5), sw: 6, opacity: 0.45 });
      const n = hi ? 40 : detail === "mid" ? 20 : 8;
      for (let i = 0; i < n; i++) {
        const a = rand.range(0, Math.PI * 2), d = Math.sqrt(rand.next()) * 58;
        s.push({ kind: "ellipse", cx: cx + Math.cos(a) * d, cy: cy + Math.sin(a) * d, rx: 4.2, ry: 2.6, rot: rand.range(0, 180), fill: "#F1E6C8", opacity: 0.95 });
      }
      break;
    }
  }
  return s;
}

function topping(type: ToppingType, p: Pt, rand: Rand): Shape[] {
  const c = TOPPING_COLOR[type];
  const rot = rand.range(-40, 40);
  const edge = c.edge ? { stroke: c.edge, sw: 1.6 } : {};
  switch (type) {
    case "chicken":
      return [{ kind: "rect", x: p.x - 15, y: p.y - 9, w: 30 * rand.range(0.85, 1.1), h: 18, r: 7, rot, fill: c.fill, ...edge }];
    case "beef":
      return [{ kind: "rect", x: p.x - 7.5, y: p.y - 7, w: 15, h: 14 * rand.range(0.85, 1.05), r: 3.5, rot, fill: c.fill }];
    case "goat":
      return [{ kind: "rect", x: p.x - 8.5, y: p.y - 7.5, w: 17, h: 15, r: 5, rot, fill: c.fill }];
    case "beans":
      return [{ kind: "ellipse", cx: p.x, cy: p.y, rx: 3.6, ry: 6, rot, fill: c.fill }];
    case "egg":
      return [
        { kind: "ellipse", cx: p.x, cy: p.y, rx: 23, ry: 20, rot, fill: c.fill, ...edge },
        { kind: "circle", cx: p.x + 3, cy: p.y - 2, r: 9.5, fill: YOLK },
      ];
    case "plantain":
      return [{ kind: "ellipse", cx: p.x, cy: p.y, rx: 9.5, ry: 6.5, rot, fill: c.fill, ...edge }];
    case "yam":
      return [{ kind: "rect", x: p.x - 9.5, y: p.y - 8, w: 19, h: 16, r: 5, rot, fill: c.fill, ...edge }];
    case "vegetable":
      return [
        { kind: "ellipse", cx: p.x, cy: p.y, rx: 10, ry: 5, rot, fill: c.fill },
        { kind: "ellipse", cx: p.x, cy: p.y, rx: 6, ry: 2, rot, fill: LEAF_LIGHT, opacity: 0.8 },
      ];
    case "pepper":
      return [{ kind: "circle", cx: p.x, cy: p.y, r: 4.5, fill: "none", stroke: c.fill, sw: 2.4 }];
    case "banana":
      return [
        { kind: "circle", cx: p.x, cy: p.y, r: 8.5, fill: c.fill, ...edge },
        { kind: "circle", cx: p.x, cy: p.y, r: 2, fill: shade(c.fill, -0.25), opacity: 0.6 },
      ];
    case "choc":
      return [{ kind: "rect", x: p.x - 5.5, y: p.y - 5.5, w: 11, h: 11, r: 1.8, rot, fill: c.fill }];
    case "garnish":
      return [{ kind: "circle", cx: p.x, cy: p.y, r: 2.6, fill: rand.next() > 0.4 ? c.fill : LEAF_LIGHT }];
  }
}

/** Pure: same spec + detail → same shapes. Rendering lives in BowlIllustration. */
export function composeBowl(spec: BowlSpec, detail: Detail): { base: string; shapes: Shape[] } {
  const rand = rng(spec.seed);
  const base = baseColor(spec.cuisine, spec.tint);
  const shapes = texture(spec.base, base, rand, detail);
  const placed: Pt[] = [];
  // Big pieces first so small ones fill around them.
  const order = [...spec.toppings].sort((a, b) => SIZE[b.type] - SIZE[a.type]);
  for (const t of order) {
    const n = t.quantity ?? COUNTS[t.type][level(detail)];
    for (const p of scatter(rand, n, SIZE[t.type], placed, t.type === "egg" ? 0.55 : 0.82)) {
      shapes.push(...topping(t.type, p, rand));
    }
  }
  // Server and browser maths can differ in the last digit, which breaks hydration. Two places is plenty at 200×200.
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const round = (v: unknown) =>
    typeof v === "number" ? r2(v) : typeof v === "string" && v.startsWith("M ") ? v.replace(/-?\d+\.\d+/g, (m) => String(r2(Number(m)))) : v;
  return { base, shapes: shapes.map((sh) => Object.fromEntries(Object.entries(sh).map(([k, v]) => [k, round(v)])) as Shape) };
}

export function detailFor(px: number): Detail {
  return px < 56 ? "low" : px < 120 ? "mid" : "high";
}
