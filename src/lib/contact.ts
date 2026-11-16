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

export const mailtoHref = (email: string) => `mailto:${email}`;
