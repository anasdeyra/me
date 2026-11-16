import { en } from './en';

export const defaultLocale = 'en';
const dictionaries = { en } as const;

export type Locale = keyof typeof dictionaries;
export type Key = keyof typeof en;

/** Translate a key; `{name}` placeholders are filled from `vars`. */
export function t(
  key: Key,
  vars: Record<string, string | number> = {},
  locale: Locale = defaultLocale,
): string {
  const dict: Record<string, string> = dictionaries[locale] ?? en;
  const str = dict[key] ?? en[key];
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
