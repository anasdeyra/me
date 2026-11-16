import { en } from './en';

export const defaultLocale = 'en';
const dictionaries = { en } as const;

export type Locale = keyof typeof dictionaries;
export type Key = keyof typeof en;

function lookup(key: Key, locale: Locale): string {
  const dict: Record<string, string> = dictionaries[locale] ?? en;
  return dict[key] ?? en[key];
}

/** Translate a key; `{name}` placeholders are filled from `vars`. */
export function t(
  key: Key,
  vars: Record<string, string | number> = {},
  locale: Locale = defaultLocale,
): string {
  return lookup(key, locale).replace(/\{(\w+)\}/g, (_, k) =>
    String(vars[k] ?? `{${k}}`),
  );
}

export type Part = { text: string } | { slot: string };

/**
 * Split a translated sentence around `{slot}` placeholders, so a component can render links or other
 * markup in place while translators still see (and reorder) the whole sentence.
 * `tParts('notFound.help')` -> [{ text: 'Looking for… ' }, { slot: 'whatsapp' }, { text: ' or email ' }, …]
 */
export function tParts(key: Key, locale: Locale = defaultLocale): Part[] {
  return lookup(key, locale)
    .split(/(\{\w+\})/)
    .filter(Boolean)
    .map((s) => (/^\{\w+\}$/.test(s) ? { slot: s.slice(1, -1) } : { text: s }));
}
