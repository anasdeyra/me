/**
 * Damped springs as CSS easing (build time only, no deps). Material 3 Expressive specifies motion as springs
 * (damping ratio + stiffness, mass 1) instead of curves and durations. CSS has no spring timing function, so a spring
 * released from 0 towards 1 is sampled into a `linear()` easing over its settle time; the duration that goes with the
 * easing is that settle time, so the curve always plays at the spring's own tempo.
 *
 * The motion tokens in src/styles/global.css (`--ease-spring-*` / `--dur-spring-*`, `--ease-effect` / `--dur-effect`)
 * are `springEasing()` output with the defaults below; regenerate them with it when tuning (see the comment there).
 * Build-time CSS (HeroShapeStyle, MorphShape) calls it directly and samples the same curve to know how far a
 * spring overshoots (`min` / `max`), e.g. to keep an overshooting clip-path inside its box.
 */

/** A spring with mass 1: `damping` is the ratio (< 1 overshoots, 1 is critical), `stiffness` in N/m. */
export interface Spring {
  damping: number;
  stiffness: number;
}

/** The M3 Expressive motion scheme (Compose `MotionScheme.expressive()`), as used by the global.css tokens. */
export const SPRINGS = {
  /** Spatial (position, size, shape, rotation): may overshoot. */
  fast: { damping: 0.6, stiffness: 800 },
  default: { damping: 0.8, stiffness: 380 },
  slow: { damping: 0.8, stiffness: 200 },
  /** Not in the M3 scheme: expressive moments (shape morphs, pops). */
  bouncy: { damping: 0.5, stiffness: 300 },
  /** Effects (colour, opacity): critically damped, never overshoot. */
  effect: { damping: 1, stiffness: 1600 },
} satisfies Record<string, Spring>;

/** Position of a spring released at rest from 0 towards 1, after `t` seconds. */
export function springAt({ damping: z, stiffness: k }: Spring, t: number) {
  const w0 = Math.sqrt(k);
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return (
      1 -
      Math.exp(-z * w0 * t) *
        (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t))
    );
  }
  if (z === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const s = Math.sqrt(z * z - 1);
  const r1 = -w0 * (z - s);
  const r2 = -w0 * (z + s);
  return (
    1 +
    (-r2 / (r2 - r1)) * Math.exp(r1 * t) +
    (r1 / (r2 - r1)) * Math.exp(r2 * t)
  );
}

/** Seconds until the spring stays within `eps` of its target for good. */
export function springSettle(spring: Spring, eps = 0.002) {
  const dt = 0.0005;
  let last = 0;
  for (let t = 0; t < 10; t += dt)
    if (Math.abs(springAt(spring, t) - 1) >= eps) last = t;
  return last;
}

export interface SpringEasing {
  /** CSS `linear(...)` timing function. */
  easing: string;
  /** Settle time in ms (rounded up to 10 ms): the duration to pair with `easing`. */
  ms: number;
  /** The sampled progress values (first 0, last 1). */
  values: number[];
  /** Lowest and highest progress the curve reaches (overshoot > 1, undershoot < 0 never happens from rest). */
  min: number;
  max: number;
}

/** Samples a spring into `linear()` (`segments + 1` stops, 3 decimals) over its settle time. */
export function springEasing(
  spring: Spring,
  { eps = 0.002, segments = 40 } = {},
): SpringEasing {
  const s = Math.ceil(springSettle(spring, eps) * 100) / 100;
  const values = Array.from({ length: segments + 1 }, (_, i) =>
    i === segments
      ? 1
      : Math.round(springAt(spring, (s * i) / segments) * 1000) / 1000,
  );
  return {
    easing: `linear(${values.join(',')})`,
    ms: Math.round(s * 1000),
    values,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}
