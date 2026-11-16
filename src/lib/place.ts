// Locale-aware names and offsets for location and language facts (computed at build time).
import { defaultLocale, type Locale } from '@/i18n';

/** "UTC+1" for an IANA zone at build time (Africa/Tunis has no DST, so this is stable). */
export function utcOffset(timeZone: string, date = new Date()): string {
  const part = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName')?.value;
  return (part ?? 'GMT').replace(/^GMT/, 'UTC').replace(/^UTC$/, 'UTC+0');
}

/** "Tunisia" for "TN". */
export const countryName = (code: string, locale: Locale = defaultLocale) =>
  new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;

/** "English, French, and Arabic" for ["en", "fr", "ar"]. */
export function languageList(
  codes: string[],
  locale: Locale = defaultLocale,
): string {
  const names = new Intl.DisplayNames([locale], { type: 'language' });
  return new Intl.ListFormat(locale, { type: 'conjunction' }).format(
    codes.map((c) => names.of(c) ?? c),
  );
}
