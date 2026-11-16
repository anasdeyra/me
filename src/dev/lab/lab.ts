// Dev-only client logic for /lab: applies slot configs to the specimens as CSS variables.
import { fontById, fontHref, fontStack, fitWeight, weightRange, type FontDef } from './fonts';
import {
  DEFAULT_STATE,
  PRESETS,
  presetConfig,
  type LabState,
  type SlotConfig,
  type SlotName,
} from './presets';

const STORAGE_KEY = 'portfolio-lab:v1';
const SLOTS: SlotName[] = ['A', 'B'];
const NUMERIC_KEYS = new Set<keyof SlotConfig>([
  'displayWeight',
  'displayWidth',
  'displayTracking',
  'textSize',
  'textLeading',
  'ratio',
  'radius',
]);

const lab = document.querySelector<HTMLElement>('.lab')!;
const panel = document.querySelector<HTMLElement>('.lab-panel')!;
const exportBox = panel.querySelector<HTMLTextAreaElement>('.lab-export')!;
const status = panel.querySelector<HTMLElement>('.lab-status')!;

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function merge(s: Partial<LabState> | null | undefined): LabState {
  const d = clone(DEFAULT_STATE);
  if (!s) return d;
  return {
    ...d,
    ...s,
    slots: {
      A: { ...d.slots.A, ...s.slots?.A },
      B: { ...d.slots.B, ...s.slots?.B },
    },
  };
}

function encode(s: LabState): string {
  return btoa(encodeURIComponent(JSON.stringify(s)));
}

function decode(str: string): LabState | null {
  try {
    return merge(JSON.parse(decodeURIComponent(atob(str))) as Partial<LabState>);
  } catch {
    return null;
  }
}

function readState(): LabState {
  if (location.hash.startsWith('#s=')) {
    const fromHash = decode(location.hash.slice(3));
    history.replaceState(null, '', location.pathname);
    if (fromHash) return fromHash;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return merge(JSON.parse(raw) as Partial<LabState>);
  } catch {
    /* storage unavailable: fall back to defaults */
  }
  return clone(DEFAULT_STATE);
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

let state = readState();

const loadedFonts = new Set<string>();
function ensureFont(f: FontDef) {
  if (loadedFonts.has(f.id)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = fontHref(f);
  document.head.append(link);
  loadedFonts.add(f.id);
}

const rem = (px: number) => `${(px / 16).toFixed(4)}rem`;

/** Fluid type scale (Utopia-style) between a 360px and a 1240px container. */
function typeScale(cfg: SlotConfig): Record<string, string> {
  const minW = 360;
  const maxW = 1240;
  const minBase = Math.min(16, cfg.textSize);
  const minRatio = Math.min(1.2, cfg.ratio);
  const vars: Record<string, string> = {};
  for (let n = -2; n <= 6; n++) {
    const a = minBase * minRatio ** n;
    const b = cfg.textSize * cfg.ratio ** n;
    const slope = (b - a) / (maxW - minW);
    const intercept = a - slope * minW;
    const name = n < 0 ? `--step-m${-n}` : `--step-${n}`;
    vars[name] =
      `clamp(${rem(Math.min(a, b))}, ${rem(intercept)} + ${(slope * 100).toFixed(4)}cqi, ${rem(Math.max(a, b))})`;
  }
  return vars;
}

function clampWidth(f: FontDef, w: number): number {
  if (!f.wdth) return 100;
  return Math.min(f.wdth[1], Math.max(f.wdth[0], w));
}

function isEdited(cfg: SlotConfig): boolean {
  const base = presetConfig(cfg.preset, cfg.theme);
  return (Object.keys(base) as (keyof SlotConfig)[]).some((k) => base[k] !== cfg[k]);
}

function applySlot(name: SlotName) {
  const cfg = state.slots[name];
  const el = document.querySelector<HTMLElement>(`[data-specimen="${name}"]`);
  const label = document.querySelector<HTMLElement>(`[data-frame-label="${name}"]`);
  if (!el) return;

  const display = fontById(cfg.display);
  const text = fontById(cfg.text);
  const ui = fontById(cfg.ui);
  const quote = fontById(cfg.quote);
  const mono = fontById(cfg.mono);
  [display, text, ui, quote, mono].forEach(ensureFont);

  el.dataset.dir = cfg.direction;
  el.dataset.theme = cfg.theme;

  const vars: Record<string, string> = {
    '--f-display': fontStack(display),
    '--display-wght': String(fitWeight(display, cfg.displayWeight)),
    '--display-fvs': display.wdth ? `"wdth" ${clampWidth(display, cfg.displayWidth)}` : 'normal',
    '--display-track': `${cfg.displayTracking}em`,
    '--f-text': fontStack(text),
    '--text-wght': String(fitWeight(text, 400)),
    '--text-strong': String(fitWeight(text, 600)),
    '--text-leading': String(cfg.textLeading),
    '--f-ui': fontStack(ui),
    '--ui-wght': String(fitWeight(ui, 400)),
    '--ui-medium': String(fitWeight(ui, 500)),
    '--ui-strong': String(fitWeight(ui, 600)),
    '--f-quote': fontStack(quote),
    '--quote-wght': String(fitWeight(quote, 400)),
    '--quote-style': cfg.quoteItalic ? 'italic' : 'normal',
    '--f-mono': fontStack(mono),
    '--radius': `${cfg.radius}px`,
    ...typeScale(cfg),
  };
  for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);

  if (label) {
    const preset = PRESETS.find((p) => p.id === cfg.preset)?.label ?? cfg.preset;
    label.textContent = `${name}: ${preset}${isEdited(cfg) ? ' (edited)' : ''}, ${cfg.theme}. ${display.family} / ${text.family}`;
  }
}

function setChecked(name: string, value: string) {
  panel
    .querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${name}"]`)
    .forEach((i) => (i.checked = i.value === value));
}

function syncControls() {
  const cfg = state.slots[state.active];
  setChecked('view', state.view);
  setChecked('frame', state.frame);
  setChecked('active', state.active);
  setChecked('direction', cfg.direction);
  setChecked('theme', cfg.theme);

  panel.querySelectorAll<HTMLSelectElement>('select[data-slot]').forEach((s) => {
    const key = s.dataset.slot as keyof SlotConfig;
    s.value = String(cfg[key]);
  });

  const display = fontById(cfg.display);
  const weight = panel.querySelector<HTMLInputElement>('input[data-slot="displayWeight"]')!;
  const [wMin, wMax] = weightRange(display);
  weight.min = String(wMin);
  weight.max = String(wMax);
  weight.disabled = wMin === wMax;
  weight.value = String(fitWeight(display, cfg.displayWeight));

  const widthField = panel.querySelector<HTMLElement>('[data-width-field]')!;
  const width = widthField.querySelector<HTMLInputElement>('input')!;
  widthField.hidden = !display.wdth;
  if (display.wdth) {
    width.min = String(display.wdth[0]);
    width.max = String(display.wdth[1]);
    width.value = String(clampWidth(display, cfg.displayWidth));
  }

  (['displayTracking', 'textSize', 'textLeading'] as const).forEach((k) => {
    panel.querySelector<HTMLInputElement>(`input[data-slot="${k}"]`)!.value = String(cfg[k]);
  });
  panel.querySelector<HTMLInputElement>('input[data-slot="quoteItalic"]')!.checked = cfg.quoteItalic;

  const outputs: Record<string, string> = {
    displayWeight: String(fitWeight(display, cfg.displayWeight)),
    displayWidth: String(clampWidth(display, cfg.displayWidth)),
    displayTracking: `${cfg.displayTracking}em`,
    textSize: `${cfg.textSize}px`,
    textLeading: String(cfg.textLeading),
  };
  panel.querySelectorAll<HTMLOutputElement>('output[data-out]').forEach((o) => {
    o.textContent = outputs[o.dataset.out ?? ''] ?? '';
  });

  panel.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.preset === cfg.preset));
  });
}

function render() {
  lab.dataset.view = state.view;
  lab.dataset.frame = state.frame;
  lab.dataset.active = state.active;
  SLOTS.forEach(applySlot);
  syncControls();
  exportBox.value = JSON.stringify(state.slots, null, 2);
  save();
}

function updateSlot(key: keyof SlotConfig, raw: string | boolean) {
  const cfg = state.slots[state.active];
  const value = typeof raw === 'boolean' ? raw : NUMERIC_KEYS.has(key) ? Number(raw) : raw;
  (cfg as unknown as Record<string, unknown>)[key] = value;
  if (key === 'display') {
    const f = fontById(cfg.display);
    cfg.displayWeight = fitWeight(f, cfg.displayWeight);
    cfg.displayWidth = clampWidth(f, cfg.displayWidth);
  }
}

function onControl(e: Event) {
  const t = e.target as HTMLInputElement | HTMLSelectElement;
  const labKey = t.dataset.lab as 'view' | 'frame' | 'active' | undefined;
  const slotKey = t.dataset.slot as keyof SlotConfig | undefined;
  if (labKey) {
    (state as unknown as Record<string, string>)[labKey] = t.value;
    // Viewing a single slot means editing that slot.
    if (labKey === 'view' && t.value !== 'split') state.active = t.value as SlotName;
  } else if (slotKey) {
    const isCheckbox = t instanceof HTMLInputElement && t.type === 'checkbox';
    updateSlot(slotKey, isCheckbox ? t.checked : t.value);
  } else {
    return;
  }
  render();
}

panel.addEventListener('input', onControl);
panel.addEventListener('change', onControl);

function flash(msg: string) {
  status.textContent = msg;
  window.setTimeout(() => (status.textContent = ''), 2000);
}

async function copy(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text);
    flash(done);
  } catch {
    exportBox.select();
    flash('Clipboard blocked: the config is selected, press Ctrl+C.');
  }
}

panel.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!btn) return;
  if (btn.dataset.preset) {
    state.slots[state.active] = presetConfig(btn.dataset.preset, state.slots[state.active].theme);
    render();
    return;
  }
  switch (btn.dataset.action) {
    case 'copy-config':
      void copy(exportBox.value, 'Config copied.');
      break;
    case 'copy-link':
      void copy(`${location.origin}${location.pathname}#s=${encode(state)}`, 'Link copied.');
      break;
    case 'reset':
      state = clone(DEFAULT_STATE);
      render();
      flash('Reset to defaults.');
      break;
  }
});

document.addEventListener('keydown', (e) => {
  const target = e.target as HTMLElement;
  if (target.closest('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  const cfg = state.slots[state.active];
  const views = { '1': 'A', '2': 'B', '3': 'split' } as const;
  if (e.key in views) {
    state.view = views[e.key as keyof typeof views];
    if (state.view !== 'split') state.active = state.view;
  } else if (e.key === 't') cfg.theme = cfg.theme === 'light' ? 'dark' : 'light';
  else if (e.key === 'd') cfg.direction = cfg.direction === 'swiss' ? 'instrument' : 'swiss';
  else return;
  render();
});

render();
