// Minimal XML helpers for the hand-written RSS feed (D8).
const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

/** Escape text for element content and attribute values. Also drops characters XML 1.0 forbids. */
export const escapeXml = (value: string): string =>
  value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/[&<>"']/g, (c) => ENTITIES[c]);

/** RFC-822 date (GMT) from `YYYY-MM-DD` at 09:00 UTC, so the build machine's zone never shifts the day. */
export const rfc822 = (isoDate: string): string =>
  new Date(`${isoDate}T00:00:00Z`).toUTCString();
