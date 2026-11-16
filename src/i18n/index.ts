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
