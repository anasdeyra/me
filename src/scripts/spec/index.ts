// Spec mode controller (lazy chunk, loaded by SpecToggle.astro). Reads measurements, draws the overlay and fills
// the panel. One rAF per change (scroll, resize, theme, fonts, images), never a running loop; every listener,
// observer and timer hangs off one AbortController so disable() leaves nothing behind.
import { createOverlay, type Entry } from './overlay';
import { measure, outline, scan, type Facts, type SpecItem } from './measure';
import { fillPanel } from './panel';
import { mountShell, type SpecText } from './ui';

export interface SpecHost {
  announce(message: string): void;
  text: SpecText;
}

export interface Spec {
  enable(): void;
  disable(): void;
  dispose(): void;
}

/** Overlay and chips need room; below 48rem the panel (page data and lists) is the whole feature. */
const WIDE = '(min-width: 48rem)';
const toggleEl = () =>
  document.querySelector<HTMLElement>('[data-spec-toggle]');

function start(host: SpecHost, signal: AbortSignal): void {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mq = matchMedia(WIDE);

  let raf = 0;
  let flash = 0;
  let weightTimer = 0;
  let io: IntersectionObserver | undefined;
  let ro: ResizeObserver | undefined;
  let mo: MutationObserver | undefined;
  let po: PerformanceObserver | undefined;
  const shell = mountShell(host.text, {
    returnFocus: () => toggleEl()?.focus(),
  });
  // Registered first, so a throw anywhere below still leaves nothing behind (the caller aborts the signal).
  signal.addEventListener(
    'abort',
    () => {
      cancelAnimationFrame(raf);
      clearTimeout(flash);
      clearTimeout(weightTimer);
      io?.disconnect();
      ro?.disconnect();
      mo?.disconnect();
      po?.disconnect();
      shell.destroy();
    },
    { once: true },
  );
  const overlay = createOverlay(shell.layer);

  const items = scan();
  const nodes = outline();
  const landmarks = nodes.filter((n) => n.level === 0);
  const facts = new Map<SpecItem, Facts>();
  const itemOf = new Map<Element, SpecItem>(items.map((i) => [i.el, i]));
  const visible = new Set<Element>();
  let focus: HTMLElement | null = null;
  let dirty = true;

  const schedule = () => {
    if (!raf && !signal.aborted) raf = requestAnimationFrame(frame);
  };
  const invalidate = () => {
    dirty = true;
    schedule();
  };

  const panel = fillPanel(
    shell.sections,
    nodes,
    {
      jump(el) {
        el.scrollIntoView({
          block: 'center',
          behavior: reduce.matches ? 'auto' : 'smooth',
        });
        focus = el;
        clearTimeout(flash);
        flash = window.setTimeout(() => {
          focus = null;
          schedule();
        }, 1800);
        schedule();
      },
      highlight(el) {
        clearTimeout(flash);
        focus = el;
        schedule();
      },
    },
    signal,
  );

  function frame() {
    raf = 0;
    // 1. reads: measurements (only after a change), then this frame's rects
    const remeasured = dirty;
    if (dirty) {
      dirty = false;
      for (const item of items) facts.set(item, measure(item));
    }
    const wide = mq.matches;
    let entries: Entry[] = [];
    let blocked: DOMRect[] = [];
    let topInset = 0;
    if (wide) {
      const header = document.querySelector('header');
      const hr = header?.getBoundingClientRect();
      topInset = hr ? Math.max(hr.bottom, 0) : 0;
      const els = new Set<Element>(visible);
      if (focus) els.add(focus);
      for (const el of els) {
        const item = itemOf.get(el);
        const lm = landmarks.find((n) => n.el === el);
        const f = item ? facts.get(item) : undefined;
        const lines = f ? f.facts.map((x) => x.label) : [lm?.tag ?? ''];
        entries.push({
          rect: el.getBoundingClientRect(),
          facts: f,
          lines: lines.filter(Boolean),
          kind: el === focus ? 'focus' : item ? 'item' : 'landmark',
          inHeader: !!header?.contains(el),
          el,
        });
      }
      // measured items first (they win chip space), landmarks last
      const rank = { focus: 0, item: 1, landmark: 2 } as const;
      entries = entries.sort((a, b) => rank[a.kind] - rank[b.kind]);
      blocked = [shell.panel.getBoundingClientRect()];
      if (hr) blocked.push(hr);
      const t = toggleEl()?.getBoundingClientRect();
      if (t) blocked.push(t);
    }
    // 2. writes
    if (remeasured)
      panel.items(
        items
          .map((item) => ({ item, facts: facts.get(item) as Facts }))
          .filter((e) => e.facts.facts.length),
      );
    panel.small(!wide);
    if (wide) overlay.draw(entries, blocked, topInset);
    else overlay.clear();
  }

  // Elements in or near the viewport (25% margin): only those are measured on scroll.
  io = new IntersectionObserver(
    (list) => {
      for (const e of list)
        e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
      schedule();
    },
    { rootMargin: '25% 0px' },
  );
  for (const el of new Set([
    ...items.map((i) => i.el),
    ...landmarks.map((n) => n.el),
  ]))
    io.observe(el);

  // Fluid type, theme, late fonts and late images all change the numbers.
  ro = new ResizeObserver(invalidate);
  ro.observe(document.body);
  mo = new MutationObserver(invalidate);
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  void document.fonts?.ready.then(() => !signal.aborted && invalidate());
  const opts = { signal, passive: true } as const;
  addEventListener('scroll', schedule, opts);
  addEventListener('resize', invalidate, opts);
  document.addEventListener('load', invalidate, { signal, capture: true });
  mq.addEventListener('change', schedule, { signal });
  // Esc on the toggle collapses the panel too (focus is already there).
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' && e.target === toggleEl()) shell.collapse(false);
    },
    { signal },
  );

  // Lazy images and late fonts keep arriving: re-read the weight table once they settle.
  try {
    po = new PerformanceObserver(() => {
      clearTimeout(weightTimer);
      weightTimer = window.setTimeout(panel.weight, 400);
    });
    po.observe({ type: 'resource' });
  } catch {
    /* Resource Timing observer unsupported: the table keeps its opening snapshot */
  }

  schedule();
}

export function initSpec(host: SpecHost): Spec {
  let ac: AbortController | undefined;
  const enable = () => {
    if (ac) return;
    const next = new AbortController();
    try {
      start(host, next.signal);
      ac = next;
    } catch (e) {
      next.abort(); // removes the half-built host and observers
      throw e;
    }
  };
  const disable = () => {
    ac?.abort();
    ac = undefined;
  };
  return { enable, disable, dispose: disable };
}
