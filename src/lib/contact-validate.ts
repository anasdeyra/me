// Contact form rules shared by the API endpoint and the browser form script. Keep this module
// dependency-free (type imports only) so it bundles to the client without pulling in the i18n dictionary:
// errors are i18n key names, the caller translates them with t().
import type { Key } from '@/i18n';

export const CONTACT_LIMITS = {
  name: 100,
  email: 254,
  messageMin: 10,
  messageMax: 5000,
} as const;

export type ContactField = 'name' | 'email' | 'message';
export type ContactValue = Record<ContactField, string>;
export type ContactErrors = Partial<Record<ContactField, Key>>;

/** Pragmatic check (one @, a dot in the domain, no spaces); the real test is the reply bouncing. */
export const isEmail = (v: string): boolean =>
  v.length <= CONTACT_LIMITS.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

export function validateContact(
  input: Partial<Record<ContactField, unknown>>,
): { ok: true; value: ContactValue } | { ok: false; errors: ContactErrors } {
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const value: ContactValue = {
    name: str(input.name),
    email: str(input.email),
    message: str(input.message),
  };
  const errors: ContactErrors = {};
  if (!value.name || value.name.length > CONTACT_LIMITS.name) {
    errors.name = 'contact.form.err.nameRequired';
  }
  if (!isEmail(value.email)) errors.email = 'contact.form.err.emailInvalid';
  if (value.message.length < CONTACT_LIMITS.messageMin) {
    errors.message = 'contact.form.err.messageShort';
  } else if (value.message.length > CONTACT_LIMITS.messageMax) {
    errors.message = 'contact.form.err.messageLong';
  }
  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, value };
}
