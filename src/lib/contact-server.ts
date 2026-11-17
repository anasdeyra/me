// Server-only helpers for the contact endpoint (src/pages/api/contact.ts): env, rate limit, client IP, Resend.
// Never import this from client code. Message bodies are never logged.
import type { ContactValue } from './contact-validate';

/** Server-side env: `process.env` on Vercel, `import.meta.env` in `astro dev` (where .env is loaded). */
const env = (name: string): string | undefined =>
  process.env[name] ||
  (import.meta.env[name] as string | undefined) ||
  undefined;

export type MailConfig = { apiKey: string; to: string; from: string };

/** Mail settings, or undefined when the deployment is not configured (the endpoint answers 503). */
export function getMailConfig(): MailConfig | undefined {
  const apiKey = env('RESEND_API_KEY');
  const to = env('CONTACT_TO_EMAIL');
  const from = env('CONTACT_FROM_EMAIL');
  return apiKey && to && from ? { apiKey, to, from } : undefined;
}

// Sliding window per IP, in memory: best effort only (each serverless instance has its own Map).
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;
const hits = new Map<string, number[]>();

/** Records a hit; false when this IP already used its allowance in the window. */
export function rateLimit(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 1000) {
    for (const [key, list] of hits) {
      if (list.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return true;
}

/** Client IP from the proxy headers Vercel sets; "unknown" shares one bucket (dev, odd proxies). */
export function clientIp(headers: Headers): string {
  const forwarded =
    headers.get('x-forwarded-for') ?? headers.get('x-real-ip') ?? '';
  return forwarded.split(',')[0]?.trim() || 'unknown';
}

/** Single line for a mail subject: no CR/LF (header injection), capped length. */
const oneLine = (v: string) => v.replace(/[\r\n]+/g, ' ').slice(0, 100);

/** Sends the message through Resend; reply_to is the visitor so replying just works. */
export async function sendContactMail(
  config: MailConfig,
  value: ContactValue,
  location: string,
): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.from,
        to: [config.to],
        reply_to: value.email,
        subject: `New message from ${oneLine(value.name)}`,
        text: `${value.message}\n\n--\n${value.name} <${value.email}>\nSent from: ${location}`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error('contact: resend failed, status', res.status);
    return res.ok;
  } catch (error) {
    // Reason only (error name), never the payload.
    console.error(
      'contact: resend request failed,',
      error instanceof Error ? error.name : 'unknown',
    );
    return false;
  }
}
