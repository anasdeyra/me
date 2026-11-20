// Social card renderer (D9): satori (element tree -> SVG) + resvg (SVG -> PNG). Build time only: this module is
// imported by the /og endpoint and nothing that ships to the browser. Fonts are Geist .woff files read from
// node_modules relative to process.cwd() (import.meta.url is unreliable after Astro bundles the prerender chunks).
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

export interface OgCard {
  chip: string;
  title: string;
  domain: string;
  name: string;
  /** One soft Dusk glow in the top-right corner, never behind text. */
  glow?: boolean;
}

const W = 1200;
const H = 630;
const SAFE = 56;

const font = (pkg: string, file: string) =>
  readFile(
    join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file),
  );

let fonts:
  | Promise<
      { name: string; data: Buffer; weight: 400 | 500 | 600; style: 'normal' }[]
    >
  | undefined;
const loadFonts = () =>
  (fonts ??= Promise.all([
    font('geist', 'geist-latin-400-normal.woff'),
    font('geist', 'geist-latin-600-normal.woff'),
    font('geist-mono', 'geist-mono-latin-500-normal.woff'),
  ]).then(([regular, semibold, mono]) => [
    { name: 'Geist', data: regular, weight: 400, style: 'normal' },
    { name: 'Geist', data: semibold, weight: 600, style: 'normal' },
    { name: 'Geist Mono', data: mono, weight: 500, style: 'normal' },
  ]));

/** Title size by length: short titles get the full 88px, long ones step down so the card never overflows. */
const titleSize = (title: string) =>
  title.length <= 28
    ? 88
    : title.length <= 60
      ? 72
      : title.length <= 90
        ? 60
        : 52;

/** Hard cap so a pathological title cannot grow past the safe area; cuts at a word boundary. */
const MAX_TITLE = 130;
const fitTitle = (title: string) =>
  title.length <= MAX_TITLE
    ? title
    : `${title
        .slice(0, MAX_TITLE)
        .replace(/\s+\S*$/, '')
        .replace(/[\s,:;.-]+$/, '')}…`;

type Node = { type: string; props: Record<string, unknown> };
const el = (
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
): Node => ({
  type,
  props: {
    style: { display: 'flex', ...style },
    ...(children === undefined ? {} : { children }),
  },
});

export async function renderOg(card: OgCard): Promise<Uint8Array> {
  const title = fitTitle(card.title);
  const size = titleSize(title);
  const tree = el(
    'div',
    {
      width: W,
      height: H,
      position: 'relative',
      background: '#ffffff',
      color: '#0a0a0a',
      fontFamily: 'Geist',
    },
    [
      card.glow
        ? el('div', {
            position: 'absolute',
            top: -260,
            right: -220,
            width: 760,
            height: 760,
            background:
              'radial-gradient(circle at 50% 50%, rgba(255,79,129,0.34) 0%, rgba(255,178,56,0.20) 34%, rgba(122,60,255,0.12) 58%, rgba(255,255,255,0) 72%)',
          })
        : null,
      el(
        'div',
        {
          position: 'absolute',
          top: SAFE,
          left: SAFE,
          width: W - 2 * SAFE,
          height: H - 2 * SAFE,
          flexDirection: 'column',
          justifyContent: 'space-between',
        },
        [
          el(
            'div',
            {
              alignSelf: 'flex-start',
              alignItems: 'center',
              height: 40,
              padding: '0 16px',
              border: '1.5px solid #cb1459',
              borderRadius: 20,
              fontFamily: 'Geist Mono',
              fontWeight: 500,
              fontSize: 22,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            },
            card.chip,
          ),
          el(
            'div',
            {
              maxWidth: 1000,
              fontSize: size,
              fontWeight: 600,
              lineHeight: 1.06,
              letterSpacing: '-0.035em',
              textWrap: 'balance',
            },
            title,
          ),
          el(
            'div',
            {
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              borderTop: '2px solid #966303',
              paddingTop: 22,
              fontSize: 28,
            },
            [
              el(
                'div',
                { fontFamily: 'Geist Mono', fontWeight: 500, fontSize: 26 },
                card.domain,
              ),
              el('div', { fontWeight: 400, color: '#595959' }, card.name),
            ],
          ),
        ],
      ),
    ].filter(Boolean),
  );

  // satori's element type is React-shaped; plain objects are accepted at runtime.
  const svg = await satori(tree as never, {
    width: W,
    height: H,
    fonts: await loadFonts(),
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: W } })
    .render()
    .asPng();
}
