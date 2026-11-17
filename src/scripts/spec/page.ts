// Page-level data for the Spec panel: weight (Resource Timing), Lighthouse scores (committed JSON from
// scripts/lighthouse.mjs) and the security headers this server actually sends (same-origin HEAD).
import lighthouse from '@/data/lighthouse.json';

export const KB = 1024;
/** NFR-P3 budgets, compressed bytes. */
export const BUDGET = { htmlCss: 60 * KB, js: 5 * KB };

export type WeightKind = 'html' | 'css' | 'js' | 'font' | 'image' | 'other';
export interface Row {
  enc: number;
  dec: number;
  n: number;
}
export interface Weight {
  rows: Record<WeightKind, Row>;
  /** The lazy Spec chunk: shown on its own row so the tool's cost is not hidden in the page's. */
  self: Row;
  total: Row;
}

/** Classify a Resource Timing entry by file extension, then by initiator. */
export function kindOf(name: string, initiator: string): WeightKind {
  const path = new URL(name, location.href).pathname;
  const e = /\.(\w{2,5})$/.exec(path)?.[1] ?? '';
  if (e === 'css') return 'css';
  if (e === 'js' || e === 'mjs') return 'js';
  if (['woff2', 'woff', 'ttf', 'otf'].includes(e)) return 'font';
  if (['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'svg', 'ico'].includes(e))
    return 'image';
  if (initiator === 'script') return 'js';
  if (initiator === 'img') return 'image';
  return 'other';
}

const SELF = /\/_astro\/spec[.-]/;
const empty = (): Row => ({ enc: 0, dec: 0, n: 0 });
const add = (
  r: Row,
  e: { encodedBodySize: number; decodedBodySize: number },
) => {
  r.enc += e.encodedBodySize;
  r.dec += e.decodedBodySize;
  r.n++;
};

export function pageWeight(): Weight {
  const rows = {
    html: empty(),
    css: empty(),
    js: empty(),
    font: empty(),
    image: empty(),
    other: empty(),
  };
  const self = empty();
  const total = empty();
  const nav = performance.getEntriesByType('navigation')[0] as
    PerformanceNavigationTiming | undefined;
  if (nav) {
    add(rows.html, nav);
    add(total, nav);
  }
  for (const e of performance.getEntriesByType(
    'resource',
  ) as PerformanceResourceTiming[]) {
    // Spec mode's own HEAD request for the headers is not part of the page.
    if (e.initiatorType === 'fetch' && e.name === location.href) continue;
    if (SELF.test(e.name)) add(self, e);
    else {
      add(rows[kindOf(e.name, e.initiatorType)], e);
      add(total, e);
    }
  }
  return { rows, self, total };
}

export interface Scores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}
interface LighthouseFile {
  generatedAt?: string;
  lighthouse?: string;
  preset?: string;
  pages: Record<string, Scores>;
}

/** Scores for a path from src/data/lighthouse.json; null (row hidden) when the file has no entry for it. */
export function lighthouseFor(
  pathname: string,
): { scores: Scores; date: string; preset: string } | null {
  const file = lighthouse as unknown as LighthouseFile;
  const key = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  const scores = file.pages[key];
  if (!scores) return null;
  const nums = [
    scores.performance,
    scores.accessibility,
    scores.bestPractices,
    scores.seo,
  ];
  if (!nums.every((n) => Number.isFinite(n) && n >= 0 && n <= 100)) return null;
  // generatedAt is hand-editable JSON: a bad date must never throw (Intl.format throws RangeError).
  const when = new Date(file.generatedAt ?? '');
  const date = Number.isNaN(+when)
    ? ''
    : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(when);
  return { scores, date, preset: file.preset ?? 'lab' };
}

export const SECURITY_HEADERS = [
  'content-security-policy',
  'strict-transport-security',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
  'cross-origin-opener-policy',
  'x-frame-options',
] as const;

export interface HeaderInfo {
  name: string;
  value: string | null;
}

/** HEAD of this page (GET if HEAD is refused; the body is never read). Null when the request fails. */
export async function securityHeaders(
  signal: AbortSignal,
): Promise<HeaderInfo[] | null> {
  const get = (method: string) =>
    fetch(location.href, {
      method,
      cache: 'no-store',
      credentials: 'omit',
      signal,
    });
  try {
    let res = await get('HEAD');
    if (!res.ok) {
      res = await get('GET');
      void res.body?.cancel();
    }
    // A 404/5xx page reports its own headers, not the page's: treat as unreadable.
    if (!res.ok) return null;
    return SECURITY_HEADERS.map((name) => ({
      name,
      value: res.headers.get(name),
    }));
  } catch {
    return null;
  }
}

/** Short value for display: a CSP shows its directive names, the rest their value. */
export function shortValue(name: string, value: string): string {
  if (name !== 'content-security-policy')
    return value.length > 64 ? `${value.slice(0, 63)}...` : value;
  return value
    .split(';')
    .map((d) => d.trim().split(/\s+/)[0])
    .filter(Boolean)
    .join(', ');
}

/** True when the CSP's script-src (or default-src) has neither 'unsafe-inline' nor 'unsafe-eval'. */
export function cspScriptsSafe(csp: string): boolean {
  const dirs = csp.split(';').map((d) => d.trim());
  const script =
    dirs.find((d) => d.startsWith('script-src ')) ??
    dirs.find((d) => d.startsWith('default-src '));
  return !!script && !/'unsafe-(inline|eval)'/.test(script);
}
