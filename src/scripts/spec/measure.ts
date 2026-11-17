// Spec mode measurements. `data-spec="kind[:arg] ..."` opts an element in (grammar in AGENTS.md); `outline()` is
// automatic. Everything here only reads the DOM (computed styles, rects, Resource Timing); drawing lives elsewhere.
import { st } from '@/i18n/spec';
import { contrastLabel, contrastOf } from './contrast';

export type Kind =
  'type' | 'spacing' | 'grid' | 'contrast' | 'target' | 'image' | 'note';
const KINDS: readonly string[] = [
  'type',
  'spacing',
  'grid',
  'contrast',
  'target',
  'image',
  'note',
];

export interface Directive {
  kind: Kind;
  arg: string;
}
export interface SpecItem {
  el: HTMLElement;
  directives: Directive[];
  /** Previous element sibling when it is a `spacing` item (for the gap between sections). */
  prev?: HTMLElement;
}

/** Parse `"type:text-4xl contrast"`; unknown kinds are dropped. */
export function parse(attr: string): Directive[] {
  const out: Directive[] = [];
  for (const tok of attr.split(/\s+/)) {
    const i = tok.indexOf(':');
    const kind = i < 0 ? tok : tok.slice(0, i);
    if (KINDS.includes(kind))
      out.push({ kind: kind as Kind, arg: i < 0 ? '' : tok.slice(i + 1) });
  }
  return out;
}

export const MAX_ITEMS = 400;

export function scan(root: ParentNode = document): SpecItem[] {
  const items: SpecItem[] = [];
  for (const el of root.querySelectorAll<HTMLElement>('[data-spec]')) {
    if (items.length >= MAX_ITEMS) break;
    const directives = parse(el.dataset.spec ?? '');
    if (!directives.length) continue;
    const prev = el.previousElementSibling as HTMLElement | null;
    items.push({
      el,
      directives,
      prev: prev?.dataset.spec?.includes('spacing') ? prev : undefined,
    });
  }
  return items;
}

/** One decimal at most, no trailing ".0". */
export const px = (n: number) => String(Math.round(n * 10) / 10);

export interface Fact {
  kind: Kind;
  /** Short text for the on-page chip. */
  label: string;
  /** Fuller text for the panel list. */
  detail: string;
}
export interface Facts {
  facts: Fact[];
  /** Block padding in px (drawn as bands). */
  pad?: { top: number; bottom: number };
  /** Equal columns of the grid, relative to the border box. */
  grid?: {
    cols: number;
    col: number;
    gap: number;
    /** Offset from the inline-start edge of the border box (logical, so RTL mirrors). */
    start: number;
    rtl: boolean;
    width: number;
  };
}

let measureCtx: CanvasRenderingContext2D | null | undefined;
/** Width of one "0" in the element's font, so a text block's width can be quoted in ch. */
function chWidth(cs: CSSStyleDeclaration): number {
  try {
    measureCtx ??= document.createElement('canvas').getContext('2d');
    if (!measureCtx) return 0;
    measureCtx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    return measureCtx.measureText('0').width;
  } catch {
    return 0;
  }
}

/** First family name; the Fonts API's hashed names ("Geist-a983b54ce4e17438") lose their suffix. */
const family = (cs: CSSStyleDeclaration) =>
  (cs.fontFamily.split(',')[0] ?? '')
    .replace(/["']/g, '')
    .replace(/-[0-9a-f]{12,}$/, '')
    .trim();

function imageBytes(src: string): number {
  const e = performance.getEntriesByName(src, 'resource')[0] as
    PerformanceResourceTiming | undefined;
  return e?.encodedBodySize ?? 0;
}
const kb = (n: number) => `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;

export function measure(item: SpecItem): Facts {
  const { el } = item;
  const cs = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const out: Facts = { facts: [] };
  for (const { kind, arg } of item.directives) {
    const tag = arg ? `${arg} ` : '';
    if (kind === 'type') {
      const fs = parseFloat(cs.fontSize);
      const lhPx = parseFloat(cs.lineHeight);
      const lh = Number.isNaN(lhPx) ? 'normal' : px(lhPx);
      const w = cs.fontWeight;
      const ls = parseFloat(cs.letterSpacing);
      const ch = chWidth(cs);
      const block = ['block', 'flow-root', 'list-item'].includes(cs.display);
      const bits = [
        `${family(cs)} ${w}`,
        `${px(fs)}px / ${lh}${Number.isNaN(lhPx) ? '' : `px (${px(lhPx / fs)})`}`,
        `${st('spec.m.tracking')} ${Number.isNaN(ls) ? 0 : Math.round((ls / fs) * 1000) / 1000}em`,
      ];
      if (block && ch)
        bits.push(`${st('spec.m.measure')} ${Math.round(rect.width / ch)}ch`);
      out.facts.push({
        kind,
        label: `${tag}${px(fs)}/${lh} ${w}`,
        detail: `${tag}${bits.join(', ')}`,
      });
    } else if (kind === 'spacing') {
      const top = parseFloat(cs.paddingTop) || 0;
      const bottom = parseFloat(cs.paddingBottom) || 0;
      out.pad = { top, bottom };
      const both = top === bottom ? px(top) : `${px(top)}/${px(bottom)}`;
      const gap = item.prev
        ? Math.round(rect.top - item.prev.getBoundingClientRect().bottom)
        : 0;
      out.facts.push({
        kind,
        label: `${tag}${both}`,
        detail: `${tag}${st('spec.m.padding')} ${px(top)}px / ${px(bottom)}px${gap > 0 ? `, ${st('spec.m.gap', { n: gap })}` : ''}`,
      });
    } else if (kind === 'grid') {
      const cols = cs.gridTemplateColumns.split(' ').map(parseFloat);
      const gap = parseFloat(cs.columnGap) || 0;
      const col = cols[0] ?? 0;
      if (cols.length > 1 && cols.every((c) => Math.abs(c - col) < 1))
        out.grid = {
          cols: cols.length,
          col,
          gap,
          start:
            (parseFloat(cs.paddingInlineStart) || 0) +
            (parseFloat(cs.borderInlineStartWidth) || 0),
          rtl: cs.direction === 'rtl',
          width: cols.length * col + (cols.length - 1) * gap,
        };
      out.facts.push({
        kind,
        label: st('spec.m.cols', { n: cols.length, gap: px(gap) }),
        detail: st('spec.m.cols.detail', {
          n: cols.length,
          col: px(col),
          gap: px(gap),
        }),
      });
    } else if (kind === 'contrast') {
      const text = contrastLabel(contrastOf(el));
      out.facts.push({
        kind,
        label: text,
        detail: `${st('spec.m.contrast')} ${text}`,
      });
    } else if (kind === 'target') {
      const min = parseInt(arg, 10) || 24;
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      const verdict = w >= min && h >= min ? 'ok' : 'small';
      const text = `${w}x${h} ${st(`spec.m.${verdict}`)} (${st('spec.m.min', { n: min })})`;
      out.facts.push({
        kind,
        label: text,
        detail: `${st('spec.m.target')} ${text}`,
      });
    } else if (kind === 'image') {
      const img = el as HTMLImageElement;
      const src = img.currentSrc || img.src || '';
      if (!img.complete || !img.naturalWidth) {
        out.facts.push({
          kind,
          label: st('spec.m.imgwait'),
          detail: st('spec.m.imgwait'),
        });
        continue;
      }
      const ext = (
        /\.(\w{2,5})(?:[?#]|$)/.exec(src)?.[1] ?? 'img'
      ).toLowerCase();
      const bytes = imageBytes(src);
      const dens = img.naturalWidth / (rect.width || 1);
      const dims = `${img.naturalWidth}x${img.naturalHeight} -> ${Math.round(rect.width)}x${Math.round(rect.height)} @${px(dens)}x`;
      const text = `${ext}${bytes ? ` ${kb(bytes)}` : ''} ${dims}`;
      const attrs = `${st('spec.m.loading')} ${img.loading}${img.fetchPriority !== 'auto' ? `, ${st('spec.m.fetchpriority')} ${img.fetchPriority}` : ''}`;
      out.facts.push({ kind, label: text, detail: `${text}, ${attrs}` });
    } else if (kind === 'note') {
      const text = el.dataset.specNote ?? '';
      if (text) out.facts.push({ kind, label: text, detail: text });
    }
  }
  return out;
}

export interface OutlineNode {
  el: HTMLElement;
  /** `header`, `nav`... for landmarks, `h2` for headings. */
  tag: string;
  /** 0 for landmarks, 1-6 for headings. */
  level: number;
  name: string;
  /** Heading that jumps more than one level below the previous one. */
  skips: boolean;
}

const LANDMARKS =
  'header, nav, main, aside, footer, section[aria-labelledby], section[aria-label]';

export function accessibleName(el: Element): string {
  const label = el.getAttribute('aria-label');
  if (label) return label;
  const by = el.getAttribute('aria-labelledby');
  const ref = by ? document.getElementById(by.split(' ')[0] ?? '') : null;
  return (
    (ref ?? (/^h\d$/i.test(el.tagName) ? el : null))?.textContent
      ?.trim()
      .replace(/\s+/g, ' ') ?? ''
  );
}

export function outline(root: ParentNode = document, cap = 120): OutlineNode[] {
  const out: OutlineNode[] = [];
  let last = 0;
  for (const el of root.querySelectorAll<HTMLElement>(
    `${LANDMARKS}, h1, h2, h3, h4, h5, h6`,
  )) {
    if (out.length >= cap) break;
    const tag = el.tagName.toLowerCase();
    const level = /^h\d$/.test(tag) ? +tag[1] : 0;
    const skips = level > 0 && last > 0 && level > last + 1;
    if (level) last = level;
    out.push({ el, tag, level, name: accessibleName(el), skips });
  }
  return out;
}

/** Short human name of an element for lists: tag plus the start of its text, alt or label. */
export function nameOf(el: HTMLElement): string {
  const text =
    el.getAttribute('aria-label') ||
    el.getAttribute('alt') ||
    el.textContent?.trim().replace(/\s+/g, ' ') ||
    '';
  const t = text.length > 32 ? `${text.slice(0, 31)}...` : text;
  return `${el.tagName.toLowerCase()}${t ? ` "${t}"` : ''}`;
}
