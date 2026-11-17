// Panel sections, built from the same data as the boxes on the page. Text only (textContent), no innerHTML.
import { st, type SpecKey } from '@/i18n/spec';
import { h } from './ui';
import { nameOf, type Facts, type OutlineNode, type SpecItem } from './measure';
import {
  BUDGET,
  KB,
  cspScriptsSafe,
  lighthouseFor,
  pageWeight,
  securityHeaders,
  shortValue,
  SECURITY_HEADERS,
  type Row,
  type WeightKind,
} from './page';

export interface Ctl {
  /** Scroll the element into view and flash its box. */
  jump(el: HTMLElement): void;
  /** Draw (or clear) the box of an element while a list entry is hovered or focused. */
  highlight(el: HTMLElement | null): void;
}

const size = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });
const fmt = (n: number) => `${size.format(n / KB)} KB`;

function section(key: SpecKey, ...kids: (Node | string)[]) {
  const body = h('div', { class: 'spec-sec-body' }, ...kids);
  const el = h(
    'details',
    { class: 'spec-sec', open: '' },
    h('summary', {}, st(key)),
    body,
  );
  return { el, body };
}
const row = (dt: string, dd: string | Node, cls = '') =>
  h(
    'div',
    { class: `spec-row ${cls}`.trim() },
    h('dt', {}, dt),
    h('dd', {}, dd),
  );
const list = (...rows: HTMLElement[]) => h('dl', {}, ...rows);
const note = (text: string, cls = '') =>
  h('p', { class: `spec-note ${cls}`.trim() }, text);

function entryButton(
  ctl: Ctl,
  el: HTMLElement,
  cls: string,
  ...kids: (Node | string)[]
) {
  const b = h('button', { type: 'button', class: cls }, ...kids);
  b.addEventListener('click', () => ctl.jump(el));
  for (const ev of ['pointerenter', 'focus'])
    b.addEventListener(ev, () => ctl.highlight(el));
  for (const ev of ['pointerleave', 'blur'])
    b.addEventListener(ev, () => ctl.highlight(null));
  return b;
}

export interface PanelApi {
  items(list: { item: SpecItem; facts: Facts }[]): void;
  small(on: boolean): void;
  /** Re-read Resource Timing (late images and fonts). */
  weight(): void;
}

export function fillPanel(
  container: HTMLElement,
  nodes: OutlineNode[],
  ctl: Ctl,
  signal: AbortSignal,
): PanelApi {
  const kinds: WeightKind[] = ['html', 'css', 'js', 'font', 'image', 'other'];
  const smallNote = note(st('spec.p.small'), 'spec-small');
  smallNote.hidden = true;

  // 1. Page weight (re-read when more resources load: the panel's `weight()`)
  const cell = (r: Row) =>
    h(
      'span',
      {},
      fmt(r.enc),
      r.dec > r.enc * 1.02
        ? h('small', {}, ` ${st('spec.p.rawsize', { size: fmt(r.dec) })}`)
        : '',
    );
  const weight = section('spec.p.weight');
  const renderWeight = () => {
    const w = pageWeight();
    const kids: Node[] = [];
    if (import.meta.env.DEV) kids.push(note(st('spec.p.dev'), 'spec-warn'));
    kids.push(
      list(
        ...kinds
          .filter((k) => k === 'html' || w.rows[k].n)
          .map((k) => row(st(`spec.p.${k}`), cell(w.rows[k]))),
        row(st('spec.p.total'), cell(w.total), 'spec-total'),
        ...(w.self.n
          ? [row(st('spec.p.self'), cell(w.self), 'spec-self')]
          : []),
      ),
    );
    // Budgets are in compressed bytes: a server that does not compress (preview, local) cannot be judged.
    const nav = performance.getEntriesByType('navigation')[0] as
      PerformanceNavigationTiming | undefined;
    const plain =
      !!nav &&
      nav.encodedBodySize >= nav.decodedBodySize &&
      nav.decodedBodySize > 4096;
    if (!import.meta.env.DEV && plain)
      kids.push(note(st('spec.p.nocompress'), 'spec-warn'));
    if (!import.meta.env.DEV && !plain) {
      const verdict = (used: number, max: number) =>
        used <= max
          ? st('spec.p.budget.within')
          : st('spec.p.budget.over', { size: fmt(used - max) });
      const htmlCss = w.rows.html.enc + w.rows.css.enc;
      kids.push(
        note(
          st('spec.p.budget.htmlcss', {
            used: fmt(htmlCss),
            max: fmt(BUDGET.htmlCss),
            verdict: verdict(htmlCss, BUDGET.htmlCss),
          }),
        ),
        note(
          st('spec.p.budget.js', {
            used: fmt(w.rows.js.enc),
            max: fmt(BUDGET.js),
            verdict: verdict(w.rows.js.enc, BUDGET.js),
          }),
        ),
      );
    }
    kids.push(note(st('spec.p.weight.note'), 'spec-fine'));
    weight.body.replaceChildren(...kids);
  };
  renderWeight();
  container.append(smallNote, weight.el);

  // 2. Lighthouse (only with committed data for this path)
  const lh = lighthouseFor(location.pathname);
  if (lh) {
    const s = lh.scores;
    const sec = section(
      'spec.p.lighthouse',
      note(
        lh.date
          ? st('spec.p.lighthouse.meta', { preset: lh.preset, date: lh.date })
          : lh.preset,
        'spec-fine',
      ),
      list(
        row(st('spec.p.lh.performance'), String(s.performance)),
        row(st('spec.p.lh.accessibility'), String(s.accessibility)),
        row(st('spec.p.lh.bestPractices'), String(s.bestPractices)),
        row(st('spec.p.lh.seo'), String(s.seo)),
      ),
    );
    container.append(sec.el);
  }

  // 3. Security headers
  const hdr = section('spec.p.headers', note(st('spec.p.headers.loading')));
  container.append(hdr.el);
  void securityHeaders(signal).then((res) => {
    if (signal.aborted) return;
    if (!res)
      return hdr.body.replaceChildren(note(st('spec.p.headers.failed')));
    const present = res.filter((r) => r.value !== null);
    if (!present.length)
      return hdr.body.replaceChildren(note(st('spec.p.headers.none')));
    const csp = res[0]?.value;
    hdr.body.replaceChildren(
      note(
        st('spec.p.headers.count', {
          n: present.length,
          total: SECURITY_HEADERS.length,
        }),
      ),
      list(
        ...res.map((r) =>
          row(
            r.name,
            r.value === null
              ? st('spec.p.headers.missing')
              : st('spec.p.headers.present'),
            r.value === null ? 'spec-missing' : '',
          ),
        ),
      ),
      ...(csp && cspScriptsSafe(csp)
        ? [note(st('spec.p.headers.safe'), 'spec-fine')]
        : []),
      ...present.map((r) =>
        note(
          `${r.name}: ${shortValue(r.name, r.value ?? '')}`,
          'spec-fine spec-val',
        ),
      ),
    );
  });

  // 4. Outline
  const outline = section('spec.p.outline');
  if (!nodes.length) outline.body.append(note(st('spec.p.outline.empty')));
  else
    outline.body.append(
      h(
        'ul',
        { class: 'spec-list' },
        ...nodes.map((n) =>
          h(
            'li',
            {},
            entryButton(
              ctl,
              n.el,
              `spec-entry lv${n.level}`,
              h('code', {}, n.tag),
              ` ${n.name}`,
              n.skips ? h('small', {}, ` (${st('spec.p.outline.skip')})`) : '',
            ),
          ),
        ),
      ),
    );
  container.append(outline.el);

  // 5. On this page (re-rendered when the measurements change)
  const items = section('spec.p.items');
  container.append(items.el);
  let sig = '';

  // 6. Keyboard
  const keys = section(
    'spec.p.keys',
    list(
      row('S', st('spec.p.key.s')),
      row('Esc', st('spec.p.key.esc')),
      row('Tab', st('spec.p.key.tab')),
      row('Enter', st('spec.p.key.enter')),
    ),
  );
  container.append(keys.el);

  // A table of contents on open: page weight (and Lighthouse) expanded, the longer lists one click away.
  for (const sec of [hdr, outline, items, keys]) sec.el.open = false;

  const SHOWN = 40;
  return {
    small: (on) => (smallNote.hidden = !on),
    weight: renderWeight,
    items(entries) {
      const rows = entries.map(({ item, facts }) => ({
        item,
        text: facts.facts.map((f) => f.detail).join(' | '),
      }));
      const next = rows.map((r) => `${nameOf(r.item.el)}${r.text}`).join('\n');
      if (next === sig) return;
      sig = next;
      if (!rows.length)
        return items.body.replaceChildren(note(st('spec.p.items.empty')));
      items.body.replaceChildren(
        note(st('spec.p.items.hint'), 'spec-fine'),
        h(
          'ul',
          { class: 'spec-list' },
          ...rows
            .slice(0, SHOWN)
            .map(({ item, text }) =>
              h(
                'li',
                {},
                entryButton(
                  ctl,
                  item.el,
                  'spec-entry',
                  h('b', {}, nameOf(item.el)),
                  h('span', {}, text),
                ),
              ),
            ),
        ),
        ...(rows.length > SHOWN
          ? [
              note(
                st('spec.p.items.more', { n: rows.length - SHOWN }),
                'spec-fine',
              ),
            ]
          : []),
      );
    },
  };
}
