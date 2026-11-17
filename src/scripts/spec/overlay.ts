// The blueprint layer: pooled boxes, spacing bands, grid columns and label chips inside the shadow root.
// `draw()` only writes (positions through CSSOM); the caller has already read every rect for the frame.
import { h } from './ui';
import type { Facts } from './measure';

export interface Entry {
  rect: DOMRect;
  facts?: Facts;
  /** Chip text lines (measured facts or a landmark name). */
  lines: string[];
  kind: 'item' | 'landmark' | 'focus';
  /** Inside the sticky site header: its box is drawn, its chip is not (the panel lists it). */
  inHeader?: boolean;
  /** The measured element, so chip placement can leave the text around it alone. */
  el?: Element;
}

/** Elements whose text lines a chip must not cover. */
const TEXTY =
  'p, h1, h2, h3, h4, h5, h6, a, button, li, label, summary, td, th, dt, dd, figcaption, blockquote, pre, input, textarea, small, span, strong, em, kbd, time';
const range = typeof document !== 'undefined' ? document.createRange() : null;

/** True when the chip rect would sit on a line of text (any of five sample points hits a text line). */
function coversText(x: number, y: number, w: number, hgt: number): boolean {
  const vw = document.documentElement.clientWidth;
  const pts: [number, number][] = [
    [x + 2, y + 2],
    [x + w - 2, y + 2],
    [x + 2, y + hgt - 2],
    [x + w - 2, y + hgt - 2],
    [x + w / 2, y + hgt / 2],
  ];
  const seen = new Set<Element>();
  for (const [px, py] of pts) {
    if (px < 0 || py < 0 || px >= vw || py >= innerHeight) continue;
    const hit = document.elementFromPoint(px, py)?.closest(TEXTY);
    if (!hit || seen.has(hit) || !range) continue;
    seen.add(hit);
    range.selectNodeContents(hit);
    // Tight headings have inline boxes taller than their line height: clip to the element's own box.
    const box = hit.getBoundingClientRect();
    for (const l of range.getClientRects())
      if (
        x < l.right &&
        x + w > l.left &&
        y < Math.min(l.bottom, box.bottom) &&
        y + hgt > Math.max(l.top, box.top)
      )
        return true;
  }
  return false;
}

const MAX_DRAWN = 60;
// Geist Mono is 0.6em wide: chips are sized from their text, so placing them needs no layout read.
const CHAR = 6.6;
const LINE = 15;
const PAD_X = 8;
const PAD_Y = 4;
const MAX_CHARS = 38;

class Pool {
  private nodes: HTMLElement[] = [];
  private used = 0;
  constructor(
    private parent: HTMLElement,
    private cls: string,
  ) {}
  next(): HTMLElement {
    let el = this.nodes[this.used];
    if (!el) {
      el = h('div', { class: this.cls });
      this.parent.append(el);
      this.nodes.push(el);
    }
    this.used++;
    el.hidden = false;
    return el;
  }
  begin() {
    this.used = 0;
  }
  end() {
    for (let i = this.used; i < this.nodes.length; i++)
      this.nodes[i]!.hidden = true;
  }
}

function place(
  el: HTMLElement,
  x: number,
  y: number,
  w?: number,
  hgt?: number,
  /** Hide the top `clip` px (content scrolled under the sticky header). */
  clip = 0,
) {
  el.style.translate = `${x}px ${y}px`;
  el.style.clipPath = clip > 0 ? `inset(${clip}px 0 0 0)` : '';
  if (w !== undefined) el.style.width = `${w}px`;
  if (hgt !== undefined) el.style.height = `${hgt}px`;
}

type Box = [number, number, number, number];
const hits = (taken: Box[], x: number, y: number, w: number, hgt: number) =>
  taken.some(
    ([l, t, r, b]) =>
      x < r + 2 && x + w > l - 2 && y < b + 2 && y + hgt > t - 2,
  );

export function createOverlay(layer: HTMLElement) {
  const boxes = new Pool(layer, 'spec-box');
  const bands = new Pool(layer, 'spec-band');
  const grids = new Pool(layer, 'spec-grid');
  const chips = new Pool(layer, 'spec-chip');
  const all = [boxes, bands, grids, chips];

  return {
    clear() {
      for (const p of all) {
        p.begin();
        p.end();
      }
    },
    /** `blocked`: rects the chips must stay clear of (the panel, the toggle). `topInset`: bottom edge of the sticky header. */
    draw(entries: Entry[], blocked: DOMRect[], topInset = 0) {
      const vw = document.documentElement.clientWidth;
      const vh = innerHeight;
      for (const p of all) p.begin();
      const taken: Box[] = blocked.map((r) => [
        r.left,
        r.top,
        r.right,
        r.bottom,
      ]);
      let drawn = 0;
      for (const e of entries) {
        const { rect: r } = e;
        const under = e.inHeader ? 0 : topInset;
        if (
          r.width < 1 ||
          r.height < 1 ||
          r.bottom <= under ||
          r.top > vh ||
          r.right < 0 ||
          r.left > vw
        )
          continue;
        if (++drawn > MAX_DRAWN) break;

        const box = boxes.next();
        box.className = `spec-box${e.kind === 'landmark' ? ' is-landmark' : e.kind === 'focus' ? ' is-focus' : ''}`;
        place(box, r.left, r.top, r.width, r.height, under - r.top);

        const f = e.facts;
        if (f?.pad) {
          for (const [pad, y] of [
            [f.pad.top, r.top],
            [f.pad.bottom, r.bottom - f.pad.bottom],
          ] as const)
            if (pad > 0)
              place(bands.next(), r.left, y, r.width, pad, under - y);
        }
        if (f?.grid) {
          const g = grids.next();
          g.style.setProperty('--col', `${f.grid.col}px`);
          g.style.setProperty('--gap', `${f.grid.gap}px`);
          const gx = f.grid.rtl
            ? r.right - f.grid.start - f.grid.width
            : r.left + f.grid.start;
          place(g, gx, r.top, f.grid.width, r.height, under - r.top);
        }

        if (!e.lines.length || e.inHeader) continue;
        const lines = e.lines.map((l) =>
          l.length > MAX_CHARS ? `${l.slice(0, MAX_CHARS - 1)}...` : l,
        );
        const cw = Math.max(...lines.map((l) => l.length)) * CHAR + PAD_X;
        const ch = lines.length * LINE + PAD_Y;
        // Anchor to the visible part of the block (it may start above the viewport or under the header).
        const vTop = Math.max(r.top, topInset);
        const above = r.top - ch;
        const cand: [number, number][] = [
          [r.left, above],
          [r.right - cw, above],
          [r.left, vTop],
          [r.right - cw, vTop],
          [r.left, r.bottom],
          [r.right - cw, r.bottom],
          [r.left, r.bottom - ch],
          [r.right - cw, r.bottom - ch],
        ];
        for (const [cx, cy] of cand) {
          const x = Math.min(Math.max(cx, 0), Math.max(vw - cw, 0));
          const y = Math.min(
            Math.max(cy, topInset),
            Math.max(vh - ch, topInset),
          );
          if (hits(taken, x, y, cw, ch) || coversText(x, y, cw, ch)) continue;
          taken.push([x, y, x + cw, y + ch]);
          const chip = chips.next();
          chip.className = `spec-chip${e.kind === 'landmark' ? ' is-landmark' : ''}`;
          const text = lines.join('\n');
          if (chip.textContent !== text) chip.textContent = text;
          place(chip, x, y);
          break;
        }
      }
      for (const p of all) p.end();
    },
  };
}
