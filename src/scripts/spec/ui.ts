// Spec layer DOM: one shadow host appended to <body>. The stylesheet is a same-origin built file linked inside
// the shadow root (covered by style-src 'self'); no <style> elements, no innerHTML, positions only via CSSOM.
import { setShortcutsEnabled, shortcutsEnabled } from '@/scripts/shortcuts';
import cssUrl from './spec.css?url';

export interface SpecText {
  title: string;
  hide: string;
  show: string;
  shortcuts: string;
}

export interface Shell {
  root: ShadowRoot;
  /** aria-hidden drawing surface for boxes and labels (fixed, pointer-events none). */
  layer: HTMLElement;
  panel: HTMLElement;
  /** Container for the panel sections (above the shortcuts checkbox). */
  sections: HTMLElement;
  /** Collapse to the header bar; `focus` returns focus to the toggle (Esc inside the panel). */
  collapse(focus?: boolean): void;
  destroy(): void;
}

/** Tiny element builder: attributes and text only (textContent, never HTML). */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.append(...children);
  return el;
}

export function mountShell(
  text: SpecText,
  opts: { returnFocus(): void },
): Shell {
  const host = h('div', { 'data-spec-root': '' });
  const root = host.attachShadow({ mode: 'open' });

  const link = h('link', { rel: 'stylesheet', href: cssUrl });
  // Hidden until the stylesheet arrives: no flash of an unstyled panel.
  host.hidden = true;
  const reveal = () => (host.hidden = false);
  link.addEventListener('load', reveal);
  link.addEventListener('error', reveal);

  const layer = h('div', { class: 'spec-layer', 'aria-hidden': 'true' });
  const hide = h('button', { type: 'button', 'aria-expanded': 'true' });
  const sections = h('div', { class: 'spec-sections' });
  const body = h('div', { class: 'spec-body' });
  const checkbox = h('input', { type: 'checkbox' });
  checkbox.checked = shortcutsEnabled();
  checkbox.addEventListener('change', () =>
    setShortcutsEnabled(checkbox.checked),
  );
  body.append(
    sections,
    h('label', { class: 'spec-check' }, checkbox, text.shortcuts),
  );

  const panel = h(
    'section',
    { class: 'spec-panel', role: 'region', 'aria-label': text.title },
    h('div', { class: 'spec-head' }, h('h2', {}, text.title), hide),
    body,
  );

  const collapse = (focus = false, collapsed = true) => {
    panel.classList.toggle('is-collapsed', collapsed);
    body.hidden = collapsed;
    hide.setAttribute('aria-expanded', String(!collapsed));
    hide.textContent = collapsed ? text.show : text.hide;
    if (focus) opts.returnFocus();
  };
  collapse(false, false);

  hide.addEventListener('click', () =>
    collapse(false, !panel.classList.contains('is-collapsed')),
  );
  panel.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    e.stopPropagation();
    collapse(true);
  });

  root.append(link, layer, panel);
  document.body.append(host);

  return {
    root,
    layer,
    panel,
    sections,
    collapse: (focus = false) => collapse(focus),
    destroy: () => host.remove(),
  };
}
