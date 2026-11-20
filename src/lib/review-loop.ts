// Build-time model for the home review map (src/components/proof/ReviewLoop.astro): reviews pop from their client
// country on the map as chat bubbles. Each review's client first arrives as an avatar at the country with typing
// dots, then the bubble grows out of the avatar; avatar and bubble leave together. Everything is computed here and
// emitted as data (classes, positions) or as one generated stylesheet (ReviewLoopStyle.astro).
//
// Two playbacks (the `playback` prop):
// - `loop`: CSS keyframes with a per-review `animation-delay`, no JS. Two rhythms, picked by a container query on
//   the map stage:
//   - narrow: one bubble at a time, under the map; the next client starts typing while the current bubble is up,
//     and its bubble pops GAP1 s after the current one left. Each bubble stays for its quote's reading time.
//   - wide (a stage of 64rem or more): bubbles float over the map, and from the first width in TWO_UP_PX where the
//     layout below finds room, two at a time on two staggered tracks: a bubble pops every EVERY s (its client typing
//     for LEAD s before) and stays between EVERY + 0.6 and 2 x EVERY - LEAD - 0.2 s, by quote length. So the older
//     bubble always leaves after the newer one popped and before the next client starts typing: pops, exits and
//     arrivals never coincide, at most two bubbles and two avatars show, and it reads as bubbles popping one by one.
// - `scroll`: the map is pinned over a scroll track and each review is a step (src/scripts/review-scroll.ts); the
//   same order, sides and choreography, with entries as time-based springs (static CSS in ReviewLoop.astro).
// Two bubbles on screen are always neighbours in the loop order, so the order and each bubble's side of its country
// are chosen here, from the map geometry and an estimate of each bubble's size, so that neighbours never overlap
// each other or cover each other's avatar. Without a layout that fits, the wide rhythm stays one at a time.
import { getClients } from './content';
import { briefQuote, type ProofPlace, type Testimonial } from './proof';
import { springEasing, SPRINGS } from './spring';
import { buildWorldMap } from './world-map';

/** Seconds a client types (avatar + dots) before its bubble pops. */
const LEAD = 1.2;
/** Wide rhythm: seconds between two pops. */
const EVERY = 3.2;
/** Wide bubble life (s): the bounds keep the two-track rules (see the header). */
const LIFE2: [number, number] = [EVERY + 0.6, 2 * EVERY - LEAD - 0.2];
/** Narrow rhythm: bubble life bounds (s), and the beat between one bubble leaving and the next popping. */
const LIFE1: [number, number] = [3.2, 5.6];
const GAP1 = 0.35;
/** Reading time (s) of a quote: an orientation second plus ~350 words a minute. */
const readTime = (text: string) =>
  1 + 0.17 * text.split(/\s+/).filter(Boolean).length;
/** Lives are rounded to 0.2 s so reviews of similar length share keyframes. */
const step = (s: number) => Math.round(s * 5) / 5;
const clamp = (s: number, [lo, hi]: [number, number]) =>
  Math.min(hi, Math.max(lo, s));

/**
 * Where a bubble sits on its country: the tail's position along the bubble (percent of its width, the ends kept
 * 1.5rem in, so 0 = the bubble extends to the right, 100 = to the left), and below (`b`) or above (`a`) the country.
 */
type Tail = 0 | 25 | 50 | 75 | 100;
type V = 'a' | 'b';

export interface LoopItem {
  /** Position in the loop (0 = first, also what reduced motion shows). */
  i: number;
  iso: string;
  name: string;
  testimonial: Testimonial;
  /** The first review of its country (testimonial order): the one a country radio shows. */
  first: boolean;
  /** Country position, percent of the map frame. */
  x: number;
  y: number;
  tail: Tail;
  v: V;
  /** Narrow rhythm: when the client arrives (s into the loop) and how long the bubble stays. */
  d1: number;
  life1: number;
  /** Wide two-at-a-time rhythm (when `two` is set). */
  d2: number;
  life2: number;
}

export interface LoopModel {
  items: LoopItem[];
  /** Countries with a review, in testimonial order (one radio each); `items` in testimonial order too. */
  countries: { iso: string; name: string; items: LoopItem[] }[];
  width: number;
  height: number;
  /** Seconds for one full loop, one at a time. */
  period: number;
  /** Two at a time from this container width (px), with this period; absent when no layout fits. */
  two?: { minWidth: number; period: number };
}

const r3 = (n: number) => Math.round(n * 1000) / 1000;

/*
 * Bubble geometry, in CSS px. Keep in step with ReviewLoop.astro: bubbles float over the map from FLOAT_PX
 * (`@container rl (min-width: 64rem)`), `inline-size: min(20rem, 28cqi)`, tail at least 1.5rem in from a side,
 * 1.75rem from the country (clear of the 2.25rem avatar). Height is estimated: padding + header (name and role
 * lines) + quote lines (text-base at its largest, line-height 1.5, a conservative average glyph width, clamped like
 * `.q`). The avatar footprint (AV) includes the typing dots under it.
 */
const FLOAT_PX = 1024;
const TWO_UP_PX = [1024, 1088, 1152, 1216];
const B = {
  max: 320,
  share: 0.28,
  tail: 24,
  gap: 28,
  padX: 16,
  head: 30 + 39 + 10,
  font: 18,
  line: 27,
  glyph: 0.5,
  clamp: 6,
};
const AV = { half: 18, below: 28 };
/** Required space between two bubbles (covers the pop's overshoot) and around the other bubble's avatar. */
const CLEAR = 24;
const ANCHOR_CLEAR = 8;
/** Clearance beyond this is not worth trading order or preferred sides for. */
const COMFORT = 64;

interface Side {
  tail: Tail;
  v: V;
  /** Preference: below before above, tail at a corner before along the edge. */
  pref: number;
}
const SIDES: Side[] = (['b', 'a'] as const).flatMap((v) =>
  ([0, 100, 50, 25, 75] as const).map((tail) => ({
    tail,
    v,
    pref: (v === 'a' ? 1 : 0) + (tail === 0 || tail === 100 ? 0 : 1),
  })),
);

interface Box {
  l: number;
  t: number;
  r: number;
  b: number;
}

/** Greedy word wrap on character counts. */
function lineCount(text: string, perLine: number) {
  let n = 1;
  let len = 0;
  for (const w of text.split(/\s+/).filter(Boolean)) {
    const next = len === 0 ? w.length : len + 1 + w.length;
    if (next > perLine && len > 0) {
      n++;
      len = w.length;
    } else len = next;
  }
  return n;
}

/** Signed distance: positive gap when apart, negative (penetration) when overlapping. */
const dist = (dx: number, dy: number) =>
  dx > 0 || dy > 0
    ? Math.hypot(Math.max(dx, 0), Math.max(dy, 0))
    : Math.max(dx, dy);
const boxGap = (a: Box, b: Box) =>
  dist(Math.max(a.l - b.r, b.l - a.r), Math.max(a.t - b.b, b.t - a.b));

interface Spot {
  iso: string;
  /** Fractions of the map frame. */
  x: number;
  y: number;
  text: string;
}

function bubbleBox(W: number, ratio: number, s: Spot, side: Side): Box {
  const bw = Math.min(B.max, B.share * W);
  const perLine = Math.floor((bw - 2 * B.padX) / (B.font * B.glyph));
  const h = B.head + Math.min(B.clamp, lineCount(s.text, perLine)) * B.line;
  const ax = s.x * W;
  const ay = s.y * W * ratio;
  const l =
    ax - Math.min(Math.max(B.tail, (side.tail / 100) * bw), bw - B.tail);
  const t = side.v === 'b' ? ay + B.gap : ay - B.gap - h;
  return { l, t, r: l + bw, b: t + h };
}

const avatarBox = (W: number, ratio: number, s: Spot): Box => {
  const x = s.x * W;
  const y = s.y * W * ratio;
  return { l: x - AV.half, r: x + AV.half, t: y - AV.half, b: y + AV.below };
};

const overflow = (W: number, ratio: number, b: Box) =>
  Math.max(0, -b.l) +
  Math.max(0, b.r - W) +
  Math.max(0, -b.t) +
  Math.max(0, b.b - W * ratio);

/** Sides that keep the bubble inside the map at every listed width (else the least overflowing one). */
function allowedSides(spot: Spot, ratio: number, widths: number[]) {
  const scored = SIDES.map((side, k) => ({
    k,
    over: widths.reduce(
      (sum, W) => sum + overflow(W, ratio, bubbleBox(W, ratio, spot, side)),
      0,
    ),
  }));
  const fit = scored.filter((s) => s.over === 0).map((s) => s.k);
  if (fit.length) return fit;
  const least = Math.min(...scored.map((s) => s.over));
  return scored.filter((s) => s.over === least).map((s) => s.k);
}

/** Every ordering of `rest` (small inputs only). */
function* permutations<T>(rest: T[]): Generator<T[]> {
  if (rest.length <= 1) {
    yield rest;
    return;
  }
  for (let k = 0; k < rest.length; k++)
    for (const p of permutations([...rest.slice(0, k), ...rest.slice(k + 1)]))
      yield [rest[k]!, ...p];
}

const displacement = (order: number[]) =>
  order.reduce((sum, item, k) => sum + Math.abs(item - k), 0);

/** Searches orders that keep item 0 first: every one for small loops, else a pairwise-swap hill climb. */
function bestOrder<P extends { order: number[] }>(
  n: number,
  score: (order: number[]) => P | undefined,
  better: (a: P | undefined, b: P | undefined) => P | undefined,
) {
  const rest = Array.from({ length: n - 1 }, (_, k) => k + 1);
  let best: P | undefined;
  if (n <= 7) {
    for (const p of permutations(rest)) best = better(score([0, ...p]), best);
    return best;
  }
  best = score([0, ...rest]);
  for (let improved = true, pass = 0; improved && pass < 50; pass++) {
    improved = false;
    for (let a = 1; a < n; a++)
      for (let b = a + 1; b < n; b++) {
        const order = [...(best?.order ?? [0, ...rest])];
        [order[a], order[b]] = [order[b]!, order[a]!];
        const next = better(score(order), best);
        if (next !== best) {
          best = next;
          improved = true;
        }
      }
  }
  return best;
}

interface Plan {
  order: number[];
  sides: number[];
  /** Smallest clearance between neighbours, capped at COMFORT. */
  clear: number;
  cost: number;
}

/**
 * Orders the spots (spot 0 stays first) and picks a side for each so that every pair of loop neighbours (the last
 * and the first included) clears CLEAR at width W, and neither bubble covers the other's avatar: maximise the
 * smallest clearance (up to COMFORT), then prefer the testimonial order and the preferred sides.
 */
function planTwoUp(spots: Spot[], ratio: number, W: number): Plan | undefined {
  const n = spots.length;
  if (n < 2) return undefined;
  const allowed = spots.map((s) => allowedSides(s, ratio, [FLOAT_PX, W]));
  const boxes = spots.map((s) =>
    SIDES.map((side) => bubbleBox(W, ratio, s, side)),
  );
  const avatars = spots.map((s) => avatarBox(W, ratio, s));
  const clearance = (i: number, p: number, j: number, q: number) => {
    if (spots[i]!.iso === spots[j]!.iso) return -Infinity;
    const a = boxes[i]![p]!;
    const b = boxes[j]![q]!;
    return Math.min(
      COMFORT,
      boxGap(a, b) - CLEAR,
      boxGap(a, avatars[j]!) - ANCHOR_CLEAR,
      boxGap(b, avatars[i]!) - ANCHOR_CLEAR,
    );
  };

  // Cycle DP over the sides for a fixed order: the best bottleneck, then the cheapest sides at that bottleneck.
  const solve = (order: number[]) => {
    let best: { clear: number; pref: number; sides: number[] } | undefined;
    for (const p0 of allowed[order[0]!]!) {
      // Layer k maps a side of order[k] to [min clearance so far, pref sum, chosen sides].
      let layer = new Map<number, [number, number, number[]]>([
        [p0, [COMFORT, SIDES[p0]!.pref, [p0]]],
      ]);
      for (let k = 1; k < n; k++) {
        const i = order[k - 1]!;
        const j = order[k]!;
        const next = new Map<number, [number, number, number[]]>();
        for (const q of allowed[j]!)
          for (const [p, [c, s, path]] of layer) {
            const cand: [number, number, number[]] = [
              Math.min(c, clearance(i, p, j, q)),
              s + SIDES[q]!.pref,
              [...path, q],
            ];
            const cur = next.get(q);
            if (
              !cur ||
              cand[0] > cur[0] ||
              (cand[0] === cur[0] && cand[1] < cur[1])
            )
              next.set(q, cand);
          }
        layer = next;
      }
      for (const [p, [c, s, path]] of layer) {
        const clear = Math.min(c, clearance(order[n - 1]!, p, order[0]!, p0));
        if (
          !best ||
          clear > best.clear ||
          (clear === best.clear && s < best.pref)
        )
          best = { clear, pref: s, sides: path };
      }
    }
    return best;
  };
  const best = bestOrder<Plan>(
    n,
    (order) => {
      const s = solve(order);
      return s
        ? {
            order,
            sides: s.sides,
            clear: s.clear,
            cost: 2 * s.pref + displacement(order),
          }
        : undefined;
    },
    (a, b) =>
      !b ||
      (a && (a.clear > b.clear || (a.clear === b.clear && a.cost < b.cost)))
        ? a
        : b,
  );
  return best && best.clear >= 0 ? best : undefined;
}

/** One at a time only: keep the testimonial order unless a country would follow itself (two avatars on one spot). */
function spreadOrder(spots: Spot[]) {
  const n = spots.length;
  const same = (order: number[]) =>
    order.filter((k, i) => spots[k]!.iso === spots[order[(i + 1) % n]!]!.iso)
      .length;
  const best = bestOrder<{ order: number[]; cost: number }>(
    n,
    (order) => ({ order, cost: 1000 * same(order) + displacement(order) }),
    (a, b) => (!b || (a && a.cost < b.cost) ? a : b),
  );
  return best?.order ?? spots.map((_, k) => k);
}

const cache = new Map<string, LoopModel>();

export async function reviewLoopModel(
  places: ProofPlace[],
): Promise<LoopModel> {
  const clientEntries = await getClients();
  const map = buildWorldMap({
    places: clientEntries.map((c) => ({
      iso: c.entry.isoCode,
      latitude: c.entry.latitude,
      longitude: c.entry.longitude,
    })),
  });
  const { width, height } = map;
  const ratio = height / width;

  // Reviews in testimonial order, at their country.
  type Base = Omit<LoopItem, 'i' | 'tail' | 'v' | 'd1' | 'd2'>;
  const base: Base[] = [];
  for (const place of places) {
    const at = map.points.find((p) => p.iso === place.iso);
    if (!at) continue;
    place.testimonials.forEach((testimonial, k) => {
      const read = readTime(briefQuote(testimonial));
      base.push({
        iso: place.iso,
        name: place.name,
        testimonial,
        first: k === 0,
        x: r3((at.x / width) * 100),
        y: r3((at.y / height) * 100),
        life1: step(clamp(read, LIFE1)),
        life2: step(clamp(read + 0.3, LIFE2)),
      });
    });
  }
  base.sort(
    (a, b) =>
      (a.testimonial.entry.order ?? 0) - (b.testimonial.entry.order ?? 0),
  );
  const spots: Spot[] = base.map((b) => ({
    iso: b.iso,
    x: b.x / 100,
    y: b.y / 100,
    // The quote marks are generated content, so count them too.
    text: `"${briefQuote(b.testimonial)}"`,
  }));

  const key = JSON.stringify([base, width, height]);
  const hit = cache.get(key);
  if (hit) return hit;

  let plan: Plan | undefined;
  let minWidth: number | undefined;
  for (const W of TWO_UP_PX) {
    plan = planTwoUp(spots, ratio, W);
    if (plan) {
      minWidth = W;
      break;
    }
  }
  // One at a time everywhere: spread the countries, take each bubble's preferred side that fits.
  const order = plan?.order ?? spreadOrder(spots);
  const sides =
    plan?.sides ??
    order.map((k) => allowedSides(spots[k]!, ratio, [FLOAT_PX])[0]!);

  const items: LoopItem[] = order.map((k, i) => ({
    ...base[k]!,
    i,
    tail: SIDES[sides[i]!]!.tail,
    v: SIDES[sides[i]!]!.v,
    d1: 0,
    d2: r3(i * EVERY),
  }));

  // Narrow schedule: client k+1 arrives LEAD s before its pop, which is GAP1 s after bubble k left; if both reviews
  // come from one country, it waits for the first avatar to leave instead of stacking on it.
  let at = 0;
  for (const [k, it] of items.entries()) {
    it.d1 = r3(at);
    const exit = at + LEAD + it.life1;
    const next = items[(k + 1) % items.length]!;
    at =
      next.iso === it.iso && items.length > 1
        ? Math.max(exit + GAP1 - LEAD, exit + 0.15)
        : exit + GAP1 - LEAD;
  }

  const byTestimonialOrder = [...items].sort(
    (a, b) => order[a.i]! - order[b.i]!,
  );
  const countries = places
    .map((p) => ({
      iso: p.iso,
      name: p.name,
      items: byTestimonialOrder.filter((it) => it.iso === p.iso),
    }))
    .filter((c) => c.items.length > 0);
  const model: LoopModel = {
    items,
    countries,
    width,
    height,
    period: r3(at),
    two:
      minWidth === undefined
        ? undefined
        : { minWidth, period: r3(items.length * EVERY) },
  };
  cache.set(key, model);
  return model;
}

/*
 * Motion (M3 Expressive): the client's avatar pops in on the fast spatial spring and types (three dots) for LEAD s;
 * then the bubble grows out of the avatar on the bouncy spring (scale and a hint of rotation, from the avatar
 * point), its opacity on the effects spring, while the dots fade. Exits are shorter and softer: an accelerating fade
 * and a small shrink, the avatar just after its bubble. The easings are the global.css tokens, set on the elements
 * (ReviewLoop.astro); the springs' durations come from spring.ts, which generated those tokens, so each eased
 * segment of a keyframe lasts exactly its spring's settle time.
 */
const sec = (spring: keyof typeof SPRINGS) =>
  springEasing(SPRINGS[spring]).ms / 1000;
const AV_IN = sec('fast');
const POP_IN = sec('bouncy');
const FADE_IN = sec('effect');
const EXIT = 0.2;
/** M3 emphasized accelerate. */
const EXIT_EASE = 'cubic-bezier(.3,0,.8,.15)';

/** Keyframes for one rhythm of period `T`: the shared typing dots, and per bubble life `L` the avatar and bubble. */
function keyframes(
  name: (part: string, life?: number) => string,
  T: number,
  lives: number[],
) {
  const p = (s: number) => `${r3(Math.min(100, (s / T) * 100))}%`;
  const ex = `animation-timing-function:${EXIT_EASE}`;
  const shown = 'opacity:1;visibility:visible';
  const hidden = 'opacity:0;visibility:hidden';
  const up = 'transform:translateY(-.1875rem);opacity:1';
  const rest = 'transform:none;opacity:.45';
  const out = [
    // The dots show while the client types and fade as the bubble pops; each dot bounces twice (a per-dot delay).
    `@keyframes ${name('dots')}{0%{${hidden}}${p(0.25)}{${shown}}${p(LEAD - 0.02)}{${shown};${ex}}${p(LEAD + 0.18)},100%{${hidden}}}`,
    `@keyframes ${name('type')}{0%,${p(0.3)}{${rest}}${p(0.48)}{${up}}${p(0.66)},${p(0.74)}{${rest}}${p(0.92)}{${up}}${p(1.1)},100%{${rest}}}`,
  ];
  for (const L of new Set(lives)) {
    const end = LEAD + L;
    out.push(
      `@keyframes ${name('av', L)}{0%{${hidden};transform:scale(.3)}${p(AV_IN)}{${shown};transform:none}${p(end - 0.1)}{${shown};transform:none;${ex}}${p(end + 0.12)},100%{${hidden};transform:scale(.6)}}`,
      `@keyframes ${name('pop', L)}{0%,${p(LEAD)}{transform:scale(.5) rotate(var(--rl-rot,0deg))}${p(LEAD + POP_IN)}{transform:none}${p(end - EXIT)}{transform:none;${ex}}${p(end)},100%{transform:scale(.92)}}`,
      `@keyframes ${name('fade', L)}{0%,${p(LEAD)}{${hidden}}${p(LEAD + FADE_IN)}{${shown}}${p(end - EXIT)}{${shown};${ex}}${p(end)},100%{${hidden}}}`,
    );
  }
  return out.join('');
}

/**
 * The generated part of the map's CSS, scoped to `.rl-<uid>`: country positions, the two-at-a-time container query
 * (`--rl-two: 1`, also read by the scroll script) and, for the loop, its keyframes (their percentages depend on the
 * number and length of reviews), per-review delays and keyframe names, and the per-country selection rules (radio
 * ids are per uid). Everything else is static CSS in ReviewLoop.astro, which reads the names through custom
 * properties.
 */
export function reviewLoopCss(
  uid: string,
  model: LoopModel,
  playback: 'loop' | 'scroll' = 'loop',
): string {
  const { items, countries, period: T, width, height, two } = model;
  const n = items.length;
  const root = `.rl-${uid}`;
  const out: string[] = [`${root}{--rl-ar:${width}/${height}}`];
  const seen = new Set<string>();
  for (const it of items) {
    if (seen.has(it.iso)) continue;
    seen.add(it.iso);
    out.push(`${root} .at-${it.iso}{--x:${it.x}%;--y:${it.y}%;--xn:${it.x}}`);
  }
  const wide = two
    ? `@container rl (min-width:${r3(two.minWidth / 16)}rem)`
    : '';

  if (playback === 'scroll') {
    if (two) out.push(`${wide}{${root} .cmap{--rl-two:1}}`);
    return out.join('');
  }

  if (n > 1) {
    const rhythm = (
      r: 1 | 2,
      period: number,
      pick: (it: LoopItem) => [number, number],
    ) => {
      const name = (part: string, life?: number) =>
        `rl-${uid}-${part}${r}${life === undefined ? '' : `-${Math.round(life * 10)}`}`;
      const vars = items
        .map((it) => {
          const [d, life] = pick(it);
          return `${root} .q-${it.i}{--d:${d}s;--k-av:${name('av', life)};--k-pop:${name('pop', life)};--k-fade:${name('fade', life)}}`;
        })
        .join('');
      return {
        rules: `${root} .cmap{--T:${period}s;--k-dots:${name('dots')};--k-type:${name('type')}${r === 2 ? ';--rl-two:1' : ''}}${vars}`,
        frames: keyframes(
          name,
          period,
          items.map((it) => pick(it)[1]),
        ),
      };
    };
    const one = rhythm(1, T, (it) => [it.d1, it.life1]);
    out.push(one.rules, one.frames);
    if (two) {
      const both = rhythm(2, two.period, (it) => [it.d2, it.life2]);
      out.push(`${wide}{${both.rules}}`, both.frames);
    }
  }

  // Manual selection (a country radio): its first review (avatar and bubble) shows, still. Zero JS.
  const sel = countries
    .map((c) => {
      const first = c.items.find((it) => it.first) ?? c.items[0]!;
      return `${root}:has(#${uid}-c-${c.iso}:checked) .q-${first.i}.sel{animation:none;opacity:1;visibility:visible;transform:none}`;
    })
    .join('');
  out.push(`@supports selector(:has(*)){${sel}}`);
  return out.join('');
}
