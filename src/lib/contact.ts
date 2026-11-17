// Contact links built from Keystatic settings (single source of truth) and i18n microcopy.
import { t } from '@/i18n';

/**
 * `wa.me` link with a prefilled message (FR-11). Context-specific templates
 * (project:<slug>, post:<slug>, contact) are added as i18n keys when those pages exist.
 */
export function whatsappHref(
  number: string,
  text: string = t('whatsapp.prefill.default'),
): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** "21693028674" -> "+216 93 028 674": country code (heuristic), then groups of three from the end. */
export function formatPhone(number: string): string {
  const digits = number.replace(/\D/g, '');
  const ccLength = /^[17]/.test(digits) ? 1 : /^2(?!0|7)/.test(digits) ? 3 : 2;
  const national = digits.slice(ccLength);
  const groups = national.match(/\d{1,3}(?=(\d{3})*$)/g) ?? [national];
  return `+${digits.slice(0, ccLength)} ${groups.join(' ')}`;
}

export const mailtoHref = (email: string) => `mailto:${email}`;

export type WhatsappContext =
  'home_hero' | 'final' | 'contact' | 'cv' | 'about';

/** Prefilled WhatsApp message for the page or block the visitor clicked from (FR-11). */
export const whatsappPrefill = (context: WhatsappContext): string =>
  t(`whatsapp.prefill.${context}`);

/** FR-11 `project:<slug>` context: message that names the project the visitor was looking at. */
export const whatsappProjectPrefill = (title: string): string =>
  t('whatsapp.prefill.project', { title });

/** FR-11 `post:<slug>` context: message that names the post the visitor was reading. */
export const whatsappPostPrefill = (title: string): string =>
  t('whatsapp.prefill.post', { title });

// Form rules live in a dependency-free module so the browser script can import them directly.
export * from './contact-validate';
