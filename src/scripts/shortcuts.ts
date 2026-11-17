// Single-key shortcuts (WCAG 2.1.4): one shared on/off switch, persisted in localStorage. Every single-character
// shortcut on the site (`/` for search) must go through `shortcutKey`.
const KEY = 'shortcuts';

export function shortcutsEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setShortcutsEnabled(on: boolean): void {
  try {
    if (on) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, 'off');
  } catch {
    /* storage unavailable: the switch lasts for the page only */
  }
}

/** True when the keydown is `key` (a single letter is matched case-insensitively) pressed alone, outside a text field, and shortcuts are on. */
export function shortcutKey(e: KeyboardEvent, key: string): boolean {
  if (
    e.repeat ||
    (key.length === 1 ? e.key.toLowerCase() !== key : e.key !== key) ||
    e.defaultPrevented ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey ||
    !shortcutsEnabled()
  )
    return false;
  const el = e.target as HTMLElement | null;
  return !el?.closest(
    'input, textarea, select, [contenteditable]:not([contenteditable="false"])',
  );
}
