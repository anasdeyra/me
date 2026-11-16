// Dev-only font registry for the /lab page. Fonts load from Google Fonts on demand
// (the lab never ships); the chosen families get self-hosted in the real site.
// Every `spec` below was verified to return HTTP 200 from the CSS2 API.

export type FontCategory = 'sans' | 'serif' | 'display' | 'mono';

export interface FontDef {
  id: string;
  family: string;
  category: FontCategory;
  /** Google Fonts CSS2 `family=` value. */
  spec: string;
  /** Continuous weight range for variable fonts. */
  wght?: [number, number];
  /** Available weights for static fonts. */
  weights?: number[];
  /** Width axis range, when the font has one. */
  wdth?: [number, number];
  note?: string;
}

export const FONTS: FontDef[] = [
  // Sans
  { id: 'geist', family: 'Geist', category: 'sans', spec: 'Geist:wght@100..900', wght: [100, 900], note: 'Vercel; current study default' },
  { id: 'mona-sans', family: 'Mona Sans', category: 'sans', spec: 'Mona+Sans:wdth,wght@75..125,200..900', wght: [200, 900], wdth: [75, 125], note: 'GitHub; width axis' },
  { id: 'inter-tight', family: 'Inter Tight', category: 'sans', spec: 'Inter+Tight:wght@100..900', wght: [100, 900] },
  { id: 'instrument-sans', family: 'Instrument Sans', category: 'sans', spec: 'Instrument+Sans:wdth,wght@75..100,400..700', wght: [400, 700], wdth: [75, 100], note: 'condensed width axis' },
  { id: 'ibm-plex-sans', family: 'IBM Plex Sans', category: 'sans', spec: 'IBM+Plex+Sans:wdth,wght@85..100,100..700', wght: [100, 700], wdth: [85, 100] },
  { id: 'schibsted-grotesk', family: 'Schibsted Grotesk', category: 'sans', spec: 'Schibsted+Grotesk:wght@400..900', wght: [400, 900] },
  { id: 'hanken-grotesk', family: 'Hanken Grotesk', category: 'sans', spec: 'Hanken+Grotesk:wght@100..900', wght: [100, 900] },
  { id: 'archivo', family: 'Archivo', category: 'sans', spec: 'Archivo:wdth,wght@62..125,100..900', wght: [100, 900], wdth: [62, 125], note: 'wide width axis' },
  { id: 'onest', family: 'Onest', category: 'sans', spec: 'Onest:wght@100..900', wght: [100, 900] },
  { id: 'funnel-sans', family: 'Funnel Sans', category: 'sans', spec: 'Funnel+Sans:wght@300..800', wght: [300, 800] },

  // Serif
  { id: 'newsreader', family: 'Newsreader', category: 'serif', spec: 'Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800', wght: [200, 800] },
  { id: 'source-serif-4', family: 'Source Serif 4', category: 'serif', spec: 'Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900', wght: [200, 900] },
  { id: 'fraunces', family: 'Fraunces', category: 'serif', spec: 'Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900', wght: [100, 900] },
  { id: 'instrument-serif', family: 'Instrument Serif', category: 'serif', spec: 'Instrument+Serif:ital@0;1', weights: [400] },
  { id: 'literata', family: 'Literata', category: 'serif', spec: 'Literata:ital,opsz,wght@0,7..72,200..900;1,7..72,200..900', wght: [200, 900] },
  { id: 'ibm-plex-serif', family: 'IBM Plex Serif', category: 'serif', spec: 'IBM+Plex+Serif:ital,wght@0,400;0,600;1,400', weights: [400, 600] },
  { id: 'young-serif', family: 'Young Serif', category: 'serif', spec: 'Young+Serif', weights: [400] },

  // Display
  { id: 'hubot-sans', family: 'Hubot Sans', category: 'display', spec: 'Hubot+Sans:wdth,wght@75..125,200..900', wght: [200, 900], wdth: [75, 125], note: 'GitHub; width axis' },
  { id: 'michroma', family: 'Michroma', category: 'display', spec: 'Michroma', weights: [400], note: 'wide, engraved-plate feel' },
  { id: 'unbounded', family: 'Unbounded', category: 'display', spec: 'Unbounded:wght@200..900', wght: [200, 900] },
  { id: 'bricolage-grotesque', family: 'Bricolage Grotesque', category: 'display', spec: 'Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800', wght: [200, 800], wdth: [75, 100] },
  { id: 'anybody', family: 'Anybody', category: 'display', spec: 'Anybody:wdth,wght@50..150,100..900', wght: [100, 900], wdth: [50, 150], note: 'extreme width axis' },
  { id: 'funnel-display', family: 'Funnel Display', category: 'display', spec: 'Funnel+Display:wght@300..800', wght: [300, 800] },
  { id: 'big-shoulders-display', family: 'Big Shoulders Display', category: 'display', spec: 'Big+Shoulders+Display:wght@100..900', wght: [100, 900] },
  { id: 'syne', family: 'Syne', category: 'display', spec: 'Syne:wght@400..800', wght: [400, 800] },

  // Mono
  { id: 'geist-mono', family: 'Geist Mono', category: 'mono', spec: 'Geist+Mono:wght@100..900', wght: [100, 900] },
  { id: 'jetbrains-mono', family: 'JetBrains Mono', category: 'mono', spec: 'JetBrains+Mono:wght@100..800', wght: [100, 800] },
  { id: 'ibm-plex-mono', family: 'IBM Plex Mono', category: 'mono', spec: 'IBM+Plex+Mono:wght@400;500;600', weights: [400, 500, 600] },
  { id: 'martian-mono', family: 'Martian Mono', category: 'mono', spec: 'Martian+Mono:wdth,wght@75..112.5,100..800', wght: [100, 800], wdth: [75, 112.5] },
  { id: 'fragment-mono', family: 'Fragment Mono', category: 'mono', spec: 'Fragment+Mono', weights: [400] },
  { id: 'dm-mono', family: 'DM Mono', category: 'mono', spec: 'DM+Mono:wght@400;500', weights: [400, 500] },
  { id: 'azeret-mono', family: 'Azeret Mono', category: 'mono', spec: 'Azeret+Mono:wght@100..900', wght: [100, 900] },
  { id: 'red-hat-mono', family: 'Red Hat Mono', category: 'mono', spec: 'Red+Hat+Mono:wght@300..700', wght: [300, 700] },
];

export const CATEGORY_LABELS: Record<FontCategory, string> = {
  sans: 'Sans',
  serif: 'Serif',
  display: 'Display',
  mono: 'Mono',
};

const FALLBACKS: Record<FontCategory, string> = {
  sans: 'system-ui, sans-serif',
  serif: 'Georgia, serif',
  display: 'system-ui, sans-serif',
  mono: 'ui-monospace, monospace',
};

export function fontById(id: string): FontDef {
  return FONTS.find((f) => f.id === id) ?? FONTS[0]!;
}

export function fontStack(f: FontDef): string {
  return `'${f.family}', ${FALLBACKS[f.category]}`;
}

export function weightRange(f: FontDef): [number, number] {
  if (f.wght) return f.wght;
  const w = f.weights ?? [400];
  return [Math.min(...w), Math.max(...w)];
}

/** Clamp a weight to the font's range, snapping to the nearest static weight. */
export function fitWeight(f: FontDef, w: number): number {
  if (f.wght) return Math.min(f.wght[1], Math.max(f.wght[0], w));
  const w8s = f.weights ?? [400];
  return w8s.reduce((best, cur) => (Math.abs(cur - w) < Math.abs(best - w) ? cur : best), w8s[0]!);
}

export function fontHref(f: FontDef): string {
  return `https://fonts.googleapis.com/css2?family=${f.spec}&display=swap`;
}
