// Scroll playback for the review map (ReviewLoop `playback="scroll"`): the scene is pinned over a track with one step
// per review. This module only decides which step shows; the entries are CSS springs keyed on `data-on`
// (cur / prev / out) on the [data-q] parts, so they play at their own tempo instead of being scrubbed.
// No skipping: the shown step walks one step at a time towards the scroll position, at most one step per DWELL ms,
// so a fast wheel spin, PageDown, End or a scrollbar drag goes through every review instead of flashing past; while
// it walks, `data-fast` drops the typing lead. Off screen it jumps straight to the target. It never touches the
// scroll position (no snap, no trap, no hijacking): a fling past the whole section just leaves it.
const DWELL = 900;

for (const root of document.querySelectorAll<HTMLElement>(
  '.rl[data-playback="scroll"]',
)) {
  const track = root.querySelector<HTMLElement>('.track');
  const pin = root.querySelector<HTMLElement>('.pin');
  const row = root.querySelector<HTMLElement>('.steps > *');
  const cmap = root.querySelector<HTMLElement>('.cmap');
  if (!track || !pin || !row || !cmap) continue;
  const parts = [...root.querySelectorAll<HTMLElement>('.av, .bub')];
  const pips = [...root.querySelectorAll<HTMLElement>('.pips i')];
  const n = pips.length;
  let shown = -1;
  let target = -1;
  let last = -DWELL;
  let timer = 0;
  let frame = 0;
  let active = false;
  let top = 0;
  let step = 1;

  const set = (el: HTMLElement, on: string | undefined) => {
    if (on) el.dataset.on = on;
    else delete el.dataset.on;
  };
  // Step s: its review is current; on a two-at-a-time stage the previous one stays; anything else that showed leaves.
  const show = (s: number) => {
    const two =
      getComputedStyle(cmap).getPropertyValue('--rl-two').trim() === '1';
    for (const el of parts) {
      const q = Number(el.dataset.q);
      const on = el.dataset.on;
      set(
        el,
        q === s ? 'cur' : two && q === s - 1 ? 'prev' : on ? 'out' : undefined,
      );
    }
    for (const el of pips) {
      const q = Number(el.dataset.q);
      set(el, q === s ? 'cur' : q < s ? 'seen' : undefined);
    }
  };
  const tick = () => {
    timer = 0;
    if (shown === target) return;
    const wait = last + DWELL - performance.now();
    if (wait > 0) {
      timer = window.setTimeout(tick, wait);
      return;
    }
    shown += target > shown ? 1 : -1;
    last = performance.now();
    root.toggleAttribute('data-fast', shown !== target);
    show(shown);
    if (shown !== target) timer = window.setTimeout(tick, DWELL);
  };
  const measure = () => {
    frame = 0;
    if (!active) return;
    const r = track.getBoundingClientRect();
    const vh = window.innerHeight;
    // Step k rests with its snap row at the pin's top; before that, the first review shows once the scene is close.
    target =
      r.top > top + vh / 4
        ? -1
        : Math.max(0, Math.min(n - 1, Math.floor((top - r.top) / step)));
    if (r.bottom <= 0 || r.top >= vh) {
      window.clearTimeout(timer);
      timer = 0;
      root.removeAttribute('data-fast');
      if (shown !== target) show((shown = target));
      return;
    }
    if (!timer) tick();
  };
  const layout = () => {
    active = getComputedStyle(pin).position === 'sticky';
    top = parseFloat(getComputedStyle(pin).top) || 0;
    step = row.offsetHeight || 1;
    show(shown);
    measure();
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(measure);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', layout, { passive: true });
  layout();
}
