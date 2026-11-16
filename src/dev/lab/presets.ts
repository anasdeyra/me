// Dev-only presets and state shape for the /lab page.

export type Direction = 'swiss' | 'instrument';
export type Theme = 'light' | 'dark';
export type SlotName = 'A' | 'B';
export type View = 'A' | 'B' | 'split';
export type Frame = 'fluid' | '1024' | '768' | '390';

export interface SlotConfig {
  preset: string;
  direction: Direction;
  theme: Theme;
  display: string;
  displayWeight: number;
  displayWidth: number;
  displayTracking: number; // em
  text: string;
  textSize: number; // px at desktop
  textLeading: number;
  ui: string;
  quote: string;
  quoteItalic: boolean;
  mono: string;
  ratio: number;
  radius: number; // px
}

export interface LabState {
  view: View;
  active: SlotName;
  frame: Frame;
  slots: Record<SlotName, SlotConfig>;
}

export interface Preset {
  id: string;
  label: string;
  hint: string;
  config: Omit<SlotConfig, 'preset' | 'theme'>;
}

export const PRESETS: Preset[] = [
  {
    id: 'swiss',
    label: 'Swiss editorial',
    hint: 'The study as written: Geist, strong rules, asymmetric grid.',
    config: {
      direction: 'swiss',
      display: 'geist', displayWeight: 600, displayWidth: 100, displayTracking: -0.035,
      text: 'geist', textSize: 17, textLeading: 1.6,
      ui: 'geist', quote: 'geist', quoteItalic: false, mono: 'geist-mono',
      ratio: 1.333, radius: 2,
    },
  },
  {
    id: 'instrument',
    label: 'Precision instrument',
    hint: 'Mona Sans: wide headings, normal-width body, grid ticks.',
    config: {
      direction: 'instrument',
      display: 'mona-sans', displayWeight: 620, displayWidth: 118, displayTracking: -0.02,
      text: 'mona-sans', textSize: 17, textLeading: 1.6,
      ui: 'mona-sans', quote: 'mona-sans', quoteItalic: false, mono: 'geist-mono',
      ratio: 1.25, radius: 6,
    },
  },
  {
    id: 'instrument-serif-quotes',
    label: 'Instrument + serif quotes',
    hint: 'Precision instrument, with client quotes set in Newsreader italic.',
    config: {
      direction: 'instrument',
      display: 'mona-sans', displayWeight: 620, displayWidth: 118, displayTracking: -0.02,
      text: 'mona-sans', textSize: 17, textLeading: 1.6,
      ui: 'mona-sans', quote: 'newsreader', quoteItalic: true, mono: 'geist-mono',
      ratio: 1.25, radius: 6,
    },
  },
  {
    id: 'hubot-wide',
    label: 'Hubot wide',
    hint: 'Hubot Sans at full width for display, Mona Sans for text.',
    config: {
      direction: 'instrument',
      display: 'hubot-sans', displayWeight: 700, displayWidth: 125, displayTracking: -0.01,
      text: 'mona-sans', textSize: 17, textLeading: 1.6,
      ui: 'mona-sans', quote: 'mona-sans', quoteItalic: false, mono: 'martian-mono',
      ratio: 1.25, radius: 4,
    },
  },
  {
    id: 'spec-sheet',
    label: 'Spec sheet (Plex)',
    hint: 'IBM Plex Sans, Serif and Mono: engineering heritage.',
    config: {
      direction: 'swiss',
      display: 'ibm-plex-sans', displayWeight: 600, displayWidth: 100, displayTracking: -0.025,
      text: 'ibm-plex-sans', textSize: 17, textLeading: 1.6,
      ui: 'ibm-plex-sans', quote: 'ibm-plex-serif', quoteItalic: true, mono: 'ibm-plex-mono',
      ratio: 1.333, radius: 2,
    },
  },
  {
    id: 'editorial-serif',
    label: 'Editorial serif',
    hint: 'Instrument Serif headings, Instrument Sans text.',
    config: {
      direction: 'swiss',
      display: 'instrument-serif', displayWeight: 400, displayWidth: 100, displayTracking: -0.01,
      text: 'instrument-sans', textSize: 17, textLeading: 1.6,
      ui: 'instrument-sans', quote: 'instrument-serif', quoteItalic: true, mono: 'jetbrains-mono',
      ratio: 1.414, radius: 2,
    },
  },
  {
    id: 'condensed',
    label: 'Condensed',
    hint: 'Instrument Sans at width 80 for tall, tight headings.',
    config: {
      direction: 'instrument',
      display: 'instrument-sans', displayWeight: 650, displayWidth: 80, displayTracking: -0.02,
      text: 'instrument-sans', textSize: 17, textLeading: 1.6,
      ui: 'instrument-sans', quote: 'instrument-sans', quoteItalic: false, mono: 'jetbrains-mono',
      ratio: 1.333, radius: 4,
    },
  },
];

export function presetConfig(id: string, theme: Theme = 'light'): SlotConfig {
  const p = PRESETS.find((x) => x.id === id) ?? PRESETS[0]!;
  return { ...p.config, preset: p.id, theme };
}

export const DEFAULT_STATE: LabState = {
  view: 'split',
  active: 'A',
  frame: 'fluid',
  slots: {
    A: presetConfig('swiss'),
    B: presetConfig('instrument'),
  },
};

export const RATIOS: { value: number; label: string }[] = [
  { value: 1.2, label: '1.2 minor third' },
  { value: 1.25, label: '1.25 major third' },
  { value: 1.333, label: '1.333 perfect fourth' },
  { value: 1.414, label: '1.414 augmented fourth' },
  { value: 1.5, label: '1.5 perfect fifth' },
];

export const RADII = [0, 2, 4, 6, 10];
