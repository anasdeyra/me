// Colour maths for Spec mode: any CSS colour -> sRGBA, alpha compositing, WCAG 2.x contrast ratio.
// Pure functions first (unit-tested in node); the DOM part walks ancestors to find the effective background.
import { st } from '@/i18n/spec';

export type RGBA = [number, number, number, number];
export type Resolver = (css: string) => RGBA | null;

const num = String.raw`(-?[\d.]+)(%?)`;
const RGB = new RegExp(
  String.raw`^rgba?\(\s*${num}[\s,]+${num}[\s,]+${num}(?:\s*[,/]\s*${num})?\s*\)$`,
);
const SRGB = new RegExp(
  String.raw`^color\(\s*srgb\s+${num}\s+${num}\s+${num}(?:\s*/\s*${num})?\s*\)$`,
);

/** rgb()/rgba()/color(srgb) strings only (what `getComputedStyle` returns for sRGB colours); null for the rest. */
export function parseRgb(s: string): RGBA | null {
  s = s.trim().toLowerCase();
  if (s === 'transparent') return [0, 0, 0, 0];
  const srgb = SRGB.exec(s);
  const m = srgb ?? RGB.exec(s);
  if (!m) return null;
  const unit = srgb ? 255 : 1;
  const ch = (v: string, pct: string) =>
    pct ? (parseFloat(v) / 100) * 255 : parseFloat(v) * unit;
  const a = m[7] === undefined ? 1 : m[8] ? parseFloat(m[7]) / 100 : +m[7];
  return [ch(m[1], m[2]), ch(m[3], m[4]), ch(m[5], m[6]), a];
}

let ctx: CanvasRenderingContext2D | null | undefined;
/** Canvas resolver: the browser parses oklch(), color-mix(), color(display-p3 ...) and hands back sRGB pixels. */
export const canvasResolver: Resolver = (css) => {
  const fast = parseRgb(css);
  if (fast) return fast;
  try {
    ctx ??= document
      .createElement('canvas')
      .getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.fillStyle = '#010203';
    ctx.fillStyle = css;
    // An unparsable value leaves the sentinel in place.
    if (ctx.fillStyle === '#010203' && css.replace(/\s/g, '') !== '#010203')
      return null;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  } catch {
    return null; // canvas blocked (privacy mode)
  }
};

/** `top` painted over `base` (base treated as opaque when it is the last layer). */
export function over(top: RGBA, base: RGBA): RGBA {
  const a = top[3] + base[3] * (1 - top[3]);
  if (a === 0) return [0, 0, 0, 0];
  const mix = (i: number) =>
    (top[i] * top[3] + base[i] * base[3] * (1 - top[3])) / a;
  return [mix(0), mix(1), mix(2), a];
}

const lin = (v: number) => {
  v /= 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
export const luminance = (c: RGBA) =>
  0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);

export function ratio(a: RGBA, b: RGBA): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export type Grade = 'AAA' | 'AA' | 'fail';
/** WCAG 1.4.3 / 1.4.6: large text needs 3 (AA) / 4.5 (AAA); other text 4.5 / 7. */
export function grade(r: number, large: boolean): Grade {
  return r >= (large ? 4.5 : 7)
    ? 'AAA'
    : r >= (large ? 3 : 4.5)
      ? 'AA'
      : 'fail';
}
export const isLarge = (px: number, weight: number) =>
  px >= 24 || (px >= 18.66 && weight >= 700);

/** Floor to one decimal so "4.5:1" is never shown for 4.49. */
export const fmtRatio = (r: number) => (Math.floor(r * 10) / 10).toFixed(1);

export interface ContrastResult {
  ratio: number | null;
  large: boolean;
  /** A gradient or image sits behind the text: not computed. */
  image: boolean;
  grade: Grade | null;
}

export function contrastOf(
  el: Element,
  resolve: Resolver = canvasResolver,
): ContrastResult {
  const own = getComputedStyle(el);
  const px = parseFloat(own.fontSize);
  const large = isLarge(px, parseInt(own.fontWeight, 10) || 400);
  const layers: RGBA[] = [];
  let opacity = 1;
  let image = false;
  let opaque = false;
  for (let n: Element | null = el; n; n = n.parentElement) {
    const cs = n === el ? own : getComputedStyle(n);
    opacity *= parseFloat(cs.opacity);
    if (opaque) continue;
    if (cs.backgroundImage !== 'none') image = true;
    const bg = resolve(cs.backgroundColor);
    if (bg && bg[3] > 0) layers.push(bg);
    if (bg && bg[3] >= 0.999) opaque = true;
  }
  const none = { ratio: null, large, image, grade: null };
  if (image) return none;
  if (!opaque) {
    const page = resolve(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--background')
        .trim() || '#fff',
    );
    if (!page) return none;
    layers.push(page);
  }
  let base = layers.pop() as RGBA;
  while (layers.length) base = over(layers.pop() as RGBA, base);
  const fg = resolve(own.color);
  if (!fg) return none;
  const r = ratio(over([fg[0], fg[1], fg[2], fg[3] * opacity], base), base);
  return { ratio: r, large, image: false, grade: grade(r, large) };
}

/** Chip/panel label: "7.0:1 AAA pass", "2.9:1 fail", or why it is not computed. */
export function contrastLabel(c: ContrastResult): string {
  if (c.image) return st('spec.m.noimage');
  if (c.ratio === null || !c.grade) return st('spec.m.na');
  const r = `${fmtRatio(c.ratio)}:1`;
  return c.grade === 'fail'
    ? `${r} ${st('spec.m.fail', { n: c.large ? 3 : 4.5 })}`
    : `${r} ${c.grade} ${st('spec.m.pass')}`;
}
