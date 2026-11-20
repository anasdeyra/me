/**
 * Material 3 Expressive shapes as morphable CSS `clip-path: polygon()` values (build time only, no deps).
 *
 * Method:
 * 1. Each shape is built the way androidx.graphics.shapes builds `RoundedPolygon`s and the way Compose's
 *    `MaterialShapes` defines them (same vertices, `CornerRounding(radius, smoothing)`, star inner radii,
 *    mirrored/repeated point lists, rotations and scales). Corners are ported from `RoundedCorner`: a circular
 *    arc of the given radius, flanked by smoothing cubics, with cuts scaled down when two corners share a short side.
 * 2. The outline (cubics + straight edges) is flattened, then fitted into a 0..1 square, centred, like `normalized()`.
 * 3. It is resampled to a fixed number of points N at equal arc length, clockwise, starting where the ray from the
 *    centre to 12 o'clock leaves the shape. Sharp corners (spike tips, pixel steps) are pinned to a sample so they are
 *    not cut off; the arc length between pinned corners is split evenly.
 *
 * Every shape therefore has the same point count and the same anchor, so CSS interpolates `clip-path` between any two
 * of them point by point without twisting.
 */

type Vec = [number, number];
type Cubic = [Vec, Vec, Vec, Vec];

/** androidx `CornerRounding`: arc radius in shape units, smoothing 0..1. */
interface Rounding {
  radius: number;
  smoothing: number;
}

interface Vertex {
  p: Vec;
  r: Rounding;
}

interface Piece {
  cubics: Cubic[];
  /** Corner pieces only: radius actually used, and how much the outline turns there (radians). */
  corner?: { radius: number; turn: number };
}

interface ShapeDef {
  vertices: Vertex[];
  /** Linear transform [a, b, c, d]: x' = a x + b y, y' = c x + d y (y points down). */
  matrix?: [number, number, number, number];
}

const EPS = 1e-4;
const NONE: Rounding = { radius: 0, smoothing: 0 };
const round = (radius: number, smoothing = 0): Rounding => ({
  radius,
  smoothing,
});
const pt = (x: number, y: number, r: Rounding = NONE): Vertex => ({
  p: [x, y],
  r,
});

const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1]];
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]];
const mul = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k];
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1];
const len = (a: Vec) => Math.hypot(a[0], a[1]);
const norm = (a: Vec): Vec => {
  const l = len(a);
  return l > 0 ? [a[0] / l, a[1] / l] : [0, 0];
};
const rot90 = (a: Vec): Vec => [-a[1], a[0]];
const lerp = (a: Vec, b: Vec, t: number): Vec => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];
const line = (a: Vec, b: Vec): Cubic => [
  a,
  lerp(a, b, 1 / 3),
  lerp(a, b, 2 / 3),
  b,
];
const reverse = (c: Cubic): Cubic => [c[3], c[2], c[1], c[0]];
const rad = (deg: number) => (deg * Math.PI) / 180;

/* ------------------------------------------------------------------ corners (port of androidx RoundedCorner) */

interface Corner {
  p0: Vec;
  p1: Vec;
  p2: Vec;
  d1: Vec;
  d2: Vec;
  r: Rounding;
  roundCut: number;
  cut: number;
  turn: number;
}

function prepareCorner(p0: Vec, p1: Vec, p2: Vec, r: Rounding): Corner {
  const d1 = norm(sub(p0, p1));
  const d2 = norm(sub(p2, p1));
  const cos = dot(d1, d2);
  const sin = Math.sqrt(Math.max(0, 1 - cos * cos));
  const roundCut = sin > 1e-3 ? (r.radius * (cos + 1)) / sin : 0;
  return {
    p0,
    p1,
    p2,
    d1,
    d2,
    r,
    roundCut,
    cut: (1 + r.smoothing) * roundCut,
    turn: Math.PI - Math.acos(Math.min(1, Math.max(-1, cos))),
  };
}

function actualSmoothing(c: Corner, allowed: number) {
  if (allowed > c.cut) return c.r.smoothing;
  if (allowed > c.roundCut)
    return (c.r.smoothing * (allowed - c.roundCut)) / (c.cut - c.roundCut);
  return 0;
}

function lineIntersection(p0: Vec, d0: Vec, p1: Vec, d1: Vec): Vec | null {
  const r = rot90(d1);
  const den = dot(d0, r);
  if (Math.abs(den) < EPS) return null;
  const num = dot(sub(p1, p0), r);
  if (Math.abs(den) < EPS * Math.abs(num)) return null;
  return add(p0, mul(d0, num / den));
}

function circularArc(center: Vec, a: Vec, b: Vec): Cubic {
  const pa = norm(sub(a, center));
  const pb = norm(sub(b, center));
  const ra = rot90(pa);
  const rb = rot90(pb);
  const clockwise = dot(ra, sub(b, center)) >= 0;
  const cosa = dot(pa, pb);
  if (cosa > 0.999) return line(a, b);
  const k =
    ((len(sub(a, center)) * 4) / 3) *
    ((Math.sqrt(2 * (1 - cosa)) - Math.sqrt(1 - cosa * cosa)) / (1 - cosa)) *
    (clockwise ? 1 : -1);
  return [a, add(a, mul(ra, k)), sub(b, mul(rb, k)), b];
}

function flanking(
  cut: number,
  smoothing: number,
  corner: Vec,
  sideStart: Vec,
  ci: Vec,
  otherCi: Vec,
  center: Vec,
  r: number,
): Cubic {
  const sideDir = norm(sub(sideStart, corner));
  const curveStart = add(corner, mul(sideDir, cut * (1 + smoothing)));
  const p = lerp(ci, mul(add(ci, otherCi), 0.5), smoothing);
  const curveEnd = add(center, mul(norm(sub(p, center)), r));
  const tangent = rot90(sub(curveEnd, center));
  const anchorEnd =
    lineIntersection(sideStart, sideDir, curveEnd, tangent) ?? ci;
  const anchorStart = mul(add(curveStart, mul(anchorEnd, 2)), 1 / 3);
  return [curveStart, anchorStart, anchorEnd, curveEnd];
}

function cornerCubics(
  c: Corner,
  allowed0: number,
  allowed1: number,
): { cubics: Cubic[]; radius: number } {
  const allowed = Math.min(allowed0, allowed1);
  if (c.roundCut < EPS || allowed < EPS || c.r.radius < EPS)
    return { cubics: [line(c.p1, c.p1)], radius: 0 };
  const roundCut = Math.min(allowed, c.roundCut);
  const r = (c.r.radius * roundCut) / c.roundCut;
  const center = add(
    c.p1,
    mul(norm(mul(add(c.d1, c.d2), 0.5)), Math.hypot(r, roundCut)),
  );
  const ci0 = add(c.p1, mul(c.d1, roundCut));
  const ci2 = add(c.p1, mul(c.d2, roundCut));
  const f0 = flanking(
    roundCut,
    actualSmoothing(c, allowed0),
    c.p1,
    c.p0,
    ci0,
    ci2,
    center,
    r,
  );
  const f2 = reverse(
    flanking(
      roundCut,
      actualSmoothing(c, allowed1),
      c.p1,
      c.p2,
      ci2,
      ci0,
      center,
      r,
    ),
  );
  return { cubics: [f0, circularArc(center, f0[3], f2[0]), f2], radius: r };
}

/** Port of the `RoundedPolygon` constructor: rounded corners joined by straight edges. */
function roundedPolygon(vs: Vertex[]): Piece[] {
  const n = vs.length;
  const corners = vs.map((v, i) =>
    prepareCorner(vs[(i + n - 1) % n]!.p, v.p, vs[(i + 1) % n]!.p, v.r),
  );
  // Per side (i -> i+1): how much of the round cut, then of the smoothing, fits.
  const adjust = corners.map((c, i) => {
    const next = corners[(i + 1) % n]!;
    const roundCut = c.roundCut + next.roundCut;
    const cut = c.cut + next.cut;
    const side = len(sub(c.p1, next.p1));
    if (roundCut > side) return [side / roundCut, 0] as const;
    if (cut > side) return [1, (side - roundCut) / (cut - roundCut)] as const;
    return [1, 1] as const;
  });
  const built = corners.map((c, i) => {
    const allowed = [0, 1].map((delta) => {
      const [roundRatio, cutRatio] = adjust[(i + n - 1 + delta) % n]!;
      return c.roundCut * roundRatio + (c.cut - c.roundCut) * cutRatio;
    });
    return cornerCubics(c, allowed[0]!, allowed[1]!);
  });
  const pieces: Piece[] = [];
  built.forEach((b, i) => {
    pieces.push({
      cubics: b.cubics,
      corner: { radius: b.radius, turn: corners[i]!.turn },
    });
    const end = b.cubics[b.cubics.length - 1]![3];
    const start = built[(i + 1) % n]!.cubics[0]![0];
    pieces.push({ cubics: [line(end, start)] });
  });
  return pieces;
}

/* ------------------------------------------------------------------ vertex builders (androidx + MaterialShapes) */

const radial = (r: number, a: number): Vec => [
  r * Math.cos(a),
  r * Math.sin(a),
];

/** `RoundedPolygon(numVertices, radius, rounding, perVertexRounding)`: first vertex at angle 0 (pointing right). */
function regular(n: number, radius: number, rs: Rounding[]): Vertex[] {
  return Array.from({ length: n }, (_, i) => ({
    p: radial(radius, ((2 * Math.PI) / n) * i),
    r: rs[i % rs.length]!,
  }));
}

/** `RoundedPolygon.circle(numVertices)`. */
const circleVertices = (n = 8) =>
  regular(n, 1 / Math.cos(Math.PI / n), [round(1)]);

/** `RoundedPolygon.rectangle(width, height, perVertexRounding)`: bottom-right, bottom-left, top-left, top-right. */
function rectangle(w: number, h: number, rs: Rounding[]): Vertex[] {
  const c: Vec[] = [
    [w / 2, h / 2],
    [-w / 2, h / 2],
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
  ];
  return c.map((p, i) => ({ p, r: rs[i % rs.length]! }));
}

/** `RoundedPolygon.star(numVerticesPerRadius, innerRadius, rounding)`: outer vertex at angle 0. */
function star(n: number, inner: number, r: Rounding): Vertex[] {
  const out: Vertex[] = [];
  for (let i = 0; i < n; i++) {
    out.push({ p: radial(1, (Math.PI / n) * 2 * i), r });
    out.push({ p: radial(inner, (Math.PI / n) * (2 * i + 1)), r });
  }
  return out;
}

/** MaterialShapes `customPolygon` / `doRepeat`: repeat (optionally mirror) a point list around (0.5, 0.5). */
function custom(points: Vertex[], reps: number, mirroring = false): Vertex[] {
  const c: Vec = [0.5, 0.5];
  if (!mirroring) {
    const out: Vertex[] = [];
    for (let k = 0; k < reps; k++) {
      const a = (2 * Math.PI * k) / reps;
      for (const v of points) {
        const o = sub(v.p, c);
        out.push({
          p: add(c, [
            o[0] * Math.cos(a) - o[1] * Math.sin(a),
            o[0] * Math.sin(a) + o[1] * Math.cos(a),
          ]),
          r: v.r,
        });
      }
    }
    return out;
  }
  const angles = points.map(
    (v) => (Math.atan2(v.p[1] - c[1], v.p[0] - c[0]) * 180) / Math.PI,
  );
  const dists = points.map((v) => len(sub(v.p, c)));
  const actual = reps * 2;
  const section = 360 / actual;
  const out: Vertex[] = [];
  for (let k = 0; k < actual; k++) {
    for (let index = 0; index < points.length; index++) {
      const i = k % 2 === 0 ? index : points.length - 1 - index;
      if (i > 0 || k % 2 === 0) {
        const a = rad(
          section * k +
            (k % 2 === 0 ? angles[i]! : section - angles[i]! + 2 * angles[0]!),
        );
        out.push({
          p: add(c, mul([Math.cos(a), Math.sin(a)], dists[i]!)),
          r: points[i]!.r,
        });
      }
    }
  }
  return out;
}

const rotate = (deg: number): [number, number, number, number] => {
  const a = rad(deg);
  return [Math.cos(a), -Math.sin(a), Math.sin(a), Math.cos(a)];
};
const scaleY = (k: number): [number, number, number, number] => [1, 0, 0, k];
const compose = (
  m: number[],
  n: number[],
): [number, number, number, number] => [
  m[0]! * n[0]! + m[1]! * n[2]!,
  m[0]! * n[1]! + m[1]! * n[3]!,
  m[2]! * n[0]! + m[3]! * n[2]!,
  m[2]! * n[1]! + m[3]! * n[3]!,
];

const r15 = round(0.15);
const r20 = round(0.2);
const r30 = round(0.3);
const r50 = round(0.5);
const r100 = round(1);

/** Shape definitions, in the order of the M3 Expressive shape sheet (rows of 5). */
const DEFS = {
  circle: () => ({ vertices: circleVertices(10) }),
  square: () => ({ vertices: rectangle(1, 1, [r30]) }),
  slanted: () => ({
    vertices: custom(
      [
        pt(0.926, 0.97, round(0.189, 0.811)),
        pt(-0.021, 0.967, round(0.187, 0.057)),
      ],
      2,
    ),
  }),
  arch: () => ({
    vertices: regular(4, 1, [r100, r100, r20, r20]),
    matrix: rotate(-135),
  }),
  semicircle: () => ({ vertices: rectangle(1.6, 1, [r20, r20, r100, r100]) }),
  oval: () => ({
    vertices: circleVertices(),
    matrix: compose(rotate(-45), scaleY(0.64)),
  }),
  pill: () => ({
    vertices: custom(
      [pt(0.961, 0.039, round(0.426)), pt(1.001, 0.428), pt(1, 0.609, r100)],
      2,
      true,
    ),
  }),
  triangle: () => ({ vertices: regular(3, 1, [r20]), matrix: rotate(-90) }),
  arrow: () => ({
    vertices: custom(
      [
        pt(0.5, 0.892, round(0.313)),
        pt(-0.216, 1.05, round(0.207)),
        pt(0.499, -0.16, round(0.215, 1)),
        pt(1.225, 1.06, round(0.211)),
      ],
      1,
    ),
  }),
  fan: () => ({
    vertices: custom(
      [
        pt(1.004, 1, round(0.148, 0.417)),
        pt(0, 1, round(0.151)),
        pt(0, -0.003, round(0.148)),
        pt(0.978, 0.02, round(0.803)),
      ],
      1,
    ),
  }),
  diamond: () => ({
    vertices: custom(
      [pt(0.5, 1.096, round(0.151, 0.524)), pt(0.04, 0.5, round(0.159))],
      2,
    ),
  }),
  clamshell: () => ({
    vertices: custom(
      [
        pt(0.171, 0.841, round(0.159)),
        pt(-0.02, 0.5, round(0.14)),
        pt(0.17, 0.159, round(0.159)),
      ],
      2,
    ),
  }),
  pentagon: () => ({
    vertices: custom(
      [
        pt(0.5, -0.009, round(0.172)),
        pt(1.03, 0.365, round(0.164)),
        pt(0.828, 0.97, round(0.169)),
      ],
      1,
      true,
    ),
  }),
  gem: () => ({
    vertices: custom(
      [
        pt(0.499, 1.023, round(0.241, 0.778)),
        pt(-0.005, 0.792, round(0.208)),
        pt(0.073, 0.258, round(0.228)),
        pt(0.433, 0, round(0.491)),
      ],
      1,
      true,
    ),
  }),
  'very-sunny': () => ({
    vertices: custom(
      [pt(0.5, 1.08, round(0.085)), pt(0.358, 0.843, round(0.085))],
      8,
    ),
  }),
  sunny: () => ({ vertices: star(8, 0.8, r15) }),
  '4-sided-cookie': () => ({
    vertices: custom(
      [pt(1.237, 1.236, round(0.258)), pt(0.5, 0.918, round(0.233))],
      4,
    ),
  }),
  '6-sided-cookie': () => ({
    vertices: custom(
      [pt(0.723, 0.884, round(0.394)), pt(0.5, 1.099, round(0.398))],
      6,
    ),
  }),
  '7-sided-cookie': () => ({
    vertices: star(7, 0.75, r50),
    matrix: rotate(-90),
  }),
  '9-sided-cookie': () => ({
    vertices: star(9, 0.8, r50),
    matrix: rotate(-90),
  }),
  '12-sided-cookie': () => ({
    vertices: star(12, 0.8, r50),
    matrix: rotate(-90),
  }),
  '4-leaf-clover': () => ({
    vertices: custom(
      [pt(0.5, 0.074), pt(0.725, -0.099, round(0.476))],
      4,
      true,
    ),
  }),
  '8-leaf-clover': () => ({
    vertices: custom([pt(0.5, 0.036), pt(0.758, -0.101, round(0.209))], 8),
  }),
  burst: () => ({
    vertices: custom(
      [pt(0.5, -0.006, round(0.006)), pt(0.592, 0.158, round(0.006))],
      12,
    ),
  }),
  'soft-burst': () => ({
    vertices: custom(
      [pt(0.193, 0.277, round(0.053)), pt(0.176, 0.055, round(0.053))],
      10,
    ),
  }),
  boom: () => ({
    vertices: custom(
      [pt(0.457, 0.296, round(0.007)), pt(0.5, -0.051, round(0.007))],
      15,
    ),
  }),
  'soft-boom': () => ({
    vertices: custom(
      [
        pt(0.733, 0.454),
        pt(0.839, 0.437, round(0.532)),
        pt(0.949, 0.449, round(0.439, 1)),
        pt(0.998, 0.478, round(0.174)),
      ],
      16,
      true,
    ),
  }),
  flower: () => ({
    vertices: custom(
      [
        pt(0.37, 0.187),
        pt(0.416, 0.049, round(0.381)),
        pt(0.479, 0.001, round(0.095)),
      ],
      8,
      true,
    ),
  }),
  puffy: () => ({
    vertices: custom(
      [
        pt(0.5, 0.053),
        pt(0.545, -0.04, round(0.405)),
        pt(0.67, -0.035, round(0.426)),
        pt(0.717, 0.066),
        pt(0.722, 0.128),
        pt(0.777, 0.002, round(0.36)),
        pt(0.914, 0.149, round(0.66)),
        pt(0.926, 0.289, round(0.66)),
        pt(0.881, 0.346),
        pt(0.94, 0.344, round(0.126)),
        pt(1.003, 0.437, round(0.255)),
      ],
      2,
      true,
    ),
    matrix: scaleY(0.742),
  }),
  'puffy-diamond': () => ({
    vertices: custom(
      [
        pt(0.87, 0.13, round(0.146)),
        pt(0.818, 0.357),
        pt(1, 0.332, round(0.853)),
      ],
      4,
      true,
    ),
  }),
  'ghost-ish': () => ({
    vertices: custom(
      [
        pt(0.5, 0, r100),
        pt(1, 0, r100),
        pt(1, 1.14, round(0.254, 0.106)),
        pt(0.575, 0.906, round(0.253)),
      ],
      1,
      true,
    ),
  }),
  'pixel-circle': () => ({
    vertices: custom(
      [
        pt(0.5, 0),
        pt(0.704, 0),
        pt(0.704, 0.065),
        pt(0.843, 0.065),
        pt(0.843, 0.148),
        pt(0.926, 0.148),
        pt(0.926, 0.296),
        pt(1, 0.296),
      ],
      2,
      true,
    ),
  }),
  'pixel-triangle': () => ({
    vertices: custom(
      [
        pt(0.11, 0.5),
        pt(0.113, 0),
        pt(0.287, 0),
        pt(0.287, 0.087),
        pt(0.421, 0.087),
        pt(0.421, 0.17),
        pt(0.56, 0.17),
        pt(0.56, 0.265),
        pt(0.674, 0.265),
        pt(0.675, 0.344),
        pt(0.789, 0.344),
        pt(0.789, 0.439),
        pt(0.888, 0.439),
      ],
      1,
      true,
    ),
  }),
  bun: () => ({
    vertices: custom(
      [
        pt(0.796, 0.5),
        pt(0.853, 0.518, r100),
        pt(0.992, 0.631, r100),
        pt(0.968, 1, r100),
      ],
      2,
      true,
    ),
  }),
  heart: () => ({
    vertices: custom(
      [
        pt(0.5, 0.268, round(0.016)),
        pt(0.792, -0.066, round(0.958)),
        pt(1.064, 0.276, r100),
        pt(0.501, 0.946, round(0.129)),
      ],
      1,
      true,
    ),
  }),
} satisfies Record<string, () => ShapeDef>;

/** A Material 3 Expressive shape name (kebab-case). */
export type ShapeName = keyof typeof DEFS;

/** All 35 shape names, in the order of the M3 Expressive shape sheet (5 per row). */
export const SHAPES = Object.keys(DEFS) as ShapeName[];

/* ------------------------------------------------------------------ outline -> equal arc length samples */

/** Default sample count: smooth at hero sizes, room to pin every corner of Boom (30) and the pixel shapes, ~1.3 KB per polygon. */
export const DEFAULT_POINTS = 96;

interface Outline {
  pts: Vec[];
  cum: number[];
  length: number;
  /** Arc-length positions of sharp corners. */
  features: number[];
}

const STEPS = 32;
const at = (c: Cubic, t: number): Vec => {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return [
    a * c[0][0] + b * c[1][0] + d * c[2][0] + e * c[3][0],
    a * c[0][1] + b * c[1][1] + d * c[2][1] + e * c[3][1],
  ];
};

/** Flattens the shape into a dense polyline in 0..100, fitted and centred like `normalized()`. */
function outline(name: ShapeName): Outline {
  const def: ShapeDef = DEFS[name]();
  const m = def.matrix ?? [1, 0, 0, 1];
  const tf = (p: Vec): Vec => [
    m[0] * p[0] + m[1] * p[1],
    m[2] * p[0] + m[3] * p[1],
  ];
  const linearScale = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
  const pieces = roundedPolygon(def.vertices);

  const raw: Vec[] = [];
  const featureIdx: { index: number; radius: number }[] = [];
  for (const piece of pieces) {
    // Corner pieces are 1 cubic (unrounded) or 3 (flank, arc, flank): the feature point is the middle of the middle one.
    const mid =
      piece.corner && piece.corner.turn > 0.2
        ? Math.floor(piece.cubics.length / 2)
        : -1;
    const steps = piece.corner ? STEPS : 1;
    piece.cubics.forEach((c0, ci) => {
      const c = c0.map(tf) as Cubic;
      for (let s = 0; s <= steps; s++) {
        const p = at(c, s / steps);
        const last = raw[raw.length - 1];
        if (!last || len(sub(p, last)) > 1e-9) raw.push(p);
        if (ci === mid && s === steps / 2)
          featureIdx.push({
            index: raw.length - 1,
            radius: piece.corner!.radius * linearScale,
          });
      }
    });
  }
  if (len(sub(raw[0]!, raw[raw.length - 1]!)) < 1e-9) raw.pop();

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const [x, y] of raw) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const scale = 100 / Math.max(maxX - minX, maxY - minY);
  const ox = (100 - (maxX - minX) * scale) / 2;
  const oy = (100 - (maxY - minY) * scale) / 2;
  let pts: Vec[] = raw.map(([x, y]) => [
    (x - minX) * scale + ox,
    (y - minY) * scale + oy,
  ]);

  // Sharp = a corner whose arc is under 1.5% of the box (spike tips, pixel steps, clover/flower notches).
  let feats = featureIdx
    .filter((f) => f.radius * scale < 1.5)
    .map((f) => f.index % pts.length);

  // Clockwise on screen (y down): positive shoelace sum.
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    area += a[0] * b[1] - b[0] * a[1];
  }
  if (area < 0) {
    pts = pts.reverse();
    feats = feats.map((i) => pts.length - 1 - i);
  }

  const cum = [0];
  for (let i = 0; i < pts.length; i++)
    cum.push(cum[i]! + len(sub(pts[(i + 1) % pts.length]!, pts[i]!)));
  return {
    pts,
    cum,
    length: cum[pts.length]!,
    features: feats.map((i) => cum[i]!),
  };
}

function pointAt(o: Outline, s: number): Vec {
  s = ((s % o.length) + o.length) % o.length;
  let lo = 0;
  let hi = o.pts.length;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (o.cum[mid]! <= s) lo = mid;
    else hi = mid;
  }
  const seg = o.cum[lo + 1]! - o.cum[lo]!;
  return lerp(
    o.pts[lo]!,
    o.pts[(lo + 1) % o.pts.length]!,
    seg > 0 ? (s - o.cum[lo]!) / seg : 0,
  );
}

/** Arc-length position where the ray from the centre towards 12 o'clock leaves the outline (outermost crossing). */
function anchor(o: Outline): number {
  let best = 0;
  let bestY = Infinity;
  const n = o.pts.length;
  for (let i = 0; i < n; i++) {
    const a = o.pts[i]!;
    const b = o.pts[(i + 1) % n]!;
    if ((a[0] - 50) * (b[0] - 50) > 0 || a[0] === b[0]) continue;
    const t = (50 - a[0]) / (b[0] - a[0]);
    const y = a[1] + (b[1] - a[1]) * t;
    if (y < 50 && y < bestY) {
      bestY = y;
      best = o.cum[i]! + t * (o.cum[i + 1]! - o.cum[i]!);
    }
  }
  return best;
}

const cache = new Map<string, Vec[]>();

/**
 * Samples a shape as `n` points [x, y] in 0..100: clockwise, equal arc length, first point at 12 o'clock,
 * sharp corners pinned. Any two shapes with the same `n` correspond point by point.
 */
export function shapePoints(
  name: ShapeName,
  n: number = DEFAULT_POINTS,
): [number, number][] {
  if (!(name in DEFS)) throw new Error(`Unknown M3 shape: ${name}`);
  const key = `${name}:${n}`;
  const hit = cache.get(key);
  if (hit) return hit.map((p) => [p[0], p[1]]);

  const o = outline(name);
  const start = anchor(o);
  const minGap = o.length * 0.004;
  // Pinned positions relative to the anchor: the anchor itself plus every sharp corner.
  let pins = [
    0,
    ...o.features.map((f) => (((f - start) % o.length) + o.length) % o.length),
  ].sort((a, b) => a - b);
  pins = pins.filter(
    (p, i) => i === 0 || (p - pins[i - 1]! > minGap && o.length - p > minGap),
  );
  if (pins.length > n / 2) pins = [0];

  // Split the free samples so that spacing is as even as possible: always feed the segment with the widest gap.
  const gaps = pins.map((p, i) => (pins[i + 1] ?? o.length) - p);
  const extra = gaps.map(() => 0);
  for (let k = pins.length; k < n; k++) {
    let bi = 0;
    for (let i = 1; i < gaps.length; i++)
      if (gaps[i]! / (extra[i]! + 1) > gaps[bi]! / (extra[bi]! + 1)) bi = i;
    extra[bi]!++;
  }
  const out: Vec[] = [];
  pins.forEach((p, i) => {
    const step = gaps[i]! / (extra[i]! + 1);
    for (let k = 0; k <= extra[i]!; k++)
      out.push(pointAt(o, start + p + step * k));
  });
  const rounded = out.map(
    ([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100] as Vec,
  );
  cache.set(key, rounded);
  return rounded.map((p) => [p[0], p[1]]);
}

const num = (v: number, decimals = 2) => {
  const k = 10 ** decimals;
  return String(Math.round(v * k) / k);
};

/** Formatting for {@link polygon}. */
export interface PolygonOptions {
  /**
   * Percent of the box left free on every side: the shape is drawn in the central `100 - 2 * pad` percent. Gives an
   * overshooting morph room, since a clip-path cannot paint past the element's own box. Default 0.
   */
  pad?: number;
  /** Decimals per coordinate (2 is sub-pixel at any size; 1 is enough for large decorations). Default 2. */
  decimals?: number;
}

/** CSS `polygon(...)` from points in 0..100, trailing zeros dropped. */
export function polygon(
  points: [number, number][],
  { pad = 0, decimals = 2 }: PolygonOptions = {},
): string {
  const k = (100 - 2 * pad) / 100;
  return `polygon(${points
    .map(
      ([x, y]) =>
        `${num(pad + x * k, decimals)}% ${num(pad + y * k, decimals)}%`,
    )
    .join(',')})`;
}

/** CSS `polygon(...)` for a shape, percentages with up to 2 decimals (trailing zeros dropped). */
export function shapePolygon(
  name: ShapeName,
  n: number = DEFAULT_POINTS,
  opts: PolygonOptions = {},
): string {
  return polygon(shapePoints(name, n), opts);
}

/**
 * How far an outline reaches while morphing `a` -> `b` at any eased progress in `[from, to]` (a spring easing
 * overshoots past 1 and undershoots back below it), in the shapes' 0..100 units: the smallest and largest x and y
 * of any point. `{ min: 0, max: 100 }` means the morph never leaves the box.
 */
export function morphBounds(
  a: ShapeName,
  b: ShapeName,
  from: number,
  to: number,
  n: number = DEFAULT_POINTS,
): { min: number; max: number } {
  const pa = shapePoints(a, n);
  const pb = shapePoints(b, n);
  let min = 0;
  let max = 100;
  const steps = Math.max(8, Math.ceil((to - from) * 64));
  for (let s = 0; s <= steps; s++) {
    const p = from + ((to - from) * s) / steps;
    pa.forEach(([x0, y0], j) => {
      const [x1, y1] = pb[j]!;
      const x = x0 + (x1 - x0) * p;
      const y = y0 + (y1 - y0) * p;
      min = Math.min(min, x, y);
      max = Math.max(max, x, y);
    });
  }
  return { min, max };
}

/** Options for {@link morphKeyframes}. */
export interface MorphOptions extends PolygonOptions {
  /** Points per polygon (same for every shape). Default {@link DEFAULT_POINTS}. */
  points?: number;
  /** Share of each step spent holding the shape (0..1); the rest morphs into the next one. Default 0.6. */
  hold?: number;
  /** Optional `animation-timing-function` for each morph (e.g. a spring's `linear()`). */
  easing?: string;
  /**
   * true (default): every shape gets an equal step and 100% returns to the first shape (a loop). false: the shapes
   * are spread from 0% to 100%, the last one at 100% (a scrub, e.g. on a scroll timeline).
   */
  loop?: boolean;
  /**
   * Extra declarations for the frames of shape `i` (e.g. `rotate:90deg`), without a trailing semicolon. In a loop
   * the closing 100% frame asks for `i = sequence.length`, so it can differ from 0% (a full turn).
   */
  extra?: (i: number) => string;
}

/**
 * A CSS `@keyframes` rule that holds each shape of `sequence` and morphs to the next (see `loop`). Meant for an
 * inline `<style>` whose hash goes into the CSP; pair a loop with `animation: <name> <duration> infinite` only where
 * motion is allowed.
 */
export function morphKeyframes(
  name: string,
  sequence: ShapeName[],
  opts: MorphOptions = {},
): string {
  if (!/^[a-z_-][a-z0-9_-]*$/i.test(name))
    throw new Error(`Invalid keyframes name: ${name}`);
  if (sequence.length < 2)
    throw new Error('morphKeyframes needs at least two shapes');
  const n = opts.points ?? DEFAULT_POINTS;
  const loop = opts.loop ?? true;
  const hold = Math.min(1, Math.max(0, opts.hold ?? 0.6));
  const step = 100 / (loop ? sequence.length : sequence.length - 1);
  const pct = (v: number) => `${Math.round(v * 1000) / 1000}%`;
  const ease = opts.easing ? `animation-timing-function:${opts.easing};` : '';
  const frame = (sel: string[], shape: ShapeName, i: number) => {
    const extra = opts.extra?.(i);
    return `${[...new Set(sel)].join(',')}{clip-path:${shapePolygon(shape, n, opts)};${extra ? `${extra};` : ''}${ease}}`;
  };
  const frames = sequence.map((shape, i) => {
    const last = !loop && i === sequence.length - 1;
    const sel = [pct(i * step)];
    if (hold > 0 && !last) sel.push(pct(i * step + hold * step));
    return frame(sel, shape, i);
  });
  if (loop) frames.push(frame(['100%'], sequence[0]!, sequence.length));
  return `@keyframes ${name}{${frames.join('')}}`;
}
