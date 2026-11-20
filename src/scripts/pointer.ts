// Pointer position for the map flashlight. Fine pointers only, and only after the first pointermove, so touch and
// keyboard users run nothing. Writes --mx/--my (px inside the element) on the nearest
// [data-pointer] ancestor of the pointer; CSS does the drawing. rAF-throttled, cleared when the pointer leaves.
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  addEventListener('pointermove', start, { once: true, passive: true });
}

function start(first: PointerEvent) {
  let host: HTMLElement | null = null;
  let frame = 0;
  let x = 0;
  let y = 0;
  let target: EventTarget | null = null;

  const clear = (el: HTMLElement | null) => {
    for (const p of ['--mx', '--my'])
      el?.style.removeProperty(p);
  };
  const paint = () => {
    frame = 0;
    const el =
      (target as Element | null)?.closest?.<HTMLElement>('[data-pointer]') ?? null;
    if (el !== host) {
      clear(host);
      host = el;
    }
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = x - r.left;
    const py = y - r.top;
    el.style.setProperty('--mx', `${px.toFixed(1)}px`);
    el.style.setProperty('--my', `${py.toFixed(1)}px`);
  };
  const move = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    x = e.clientX;
    y = e.clientY;
    target = e.target;
    frame ||= requestAnimationFrame(paint);
  };

  addEventListener('pointermove', move, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => {
    target = null;
    frame ||= requestAnimationFrame(paint);
  });
  move(first);
}
