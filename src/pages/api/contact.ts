// Contact form endpoint (POST only). The only on-demand route of the site: /contact stays static.
// Clients: the form script (Accept: application/json -> JSON) and no-JS browsers (form post -> 303 to a static page).
//   200 { ok: true }            sent (also the fake answer to a filled honeypot)
//   422 { ok: false, errors }   field errors as i18n keys (contact.form.err.*)
//   429 { ok: false, error: 'rate_limited' }
//   503 { ok: false, error: 'unavailable' }   mail not configured or the provider failed
//   non-JSON requests: 303 -> /contact/sent on success, /contact/error otherwise
// CSRF: Astro's checkOrigin (default) rejects cross-origin form-type POSTs with 403; JSON bodies are checked below.
import type { APIRoute } from 'astro';
import { validateContact } from '@/lib/contact-validate';
import {
  clientIp,
  getMailConfig,
  rateLimit,
  sendContactMail,
} from '@/lib/contact-server';

export const prerender = false;

const LOCATIONS = ['contact', 'final'];

export const POST: APIRoute = async ({ request, url }) => {
  const json = (request.headers.get('accept') ?? '').includes(
    'application/json',
  );
  const reply = (status: number, body: Record<string, unknown>) =>
    json
      ? Response.json(body, {
          status,
          headers: { 'Cache-Control': 'no-store' },
        })
      : new Response(null, {
          status: 303,
          headers: {
            Location: status === 200 ? '/contact/sent' : '/contact/error',
            'Cache-Control': 'no-store',
          },
        });

  // Same-origin for every body type (Astro's checkOrigin only covers form content types).
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) {
    return new Response(null, { status: 403 });
  }

  let input: Record<string, unknown> = {};
  try {
    if ((request.headers.get('content-type') ?? '').includes('json')) {
      input = await request.json();
    } else {
      input = Object.fromEntries(await request.formData());
    }
  } catch {
    return reply(422, { ok: false, errors: {} });
  }

  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return reply(422, { ok: false, errors: {} });
  }

  // Honeypot: bots fill the hidden field. Answer success, send nothing, tell them nothing.
  if (
    typeof input.company_url === 'string' &&
    input.company_url.trim() !== ''
  ) {
    return reply(200, { ok: true });
  }

  // Only validated submissions count against the limit, so typos never lock a real visitor out.
  const result = validateContact(input);
  if (!result.ok) return reply(422, { ok: false, errors: result.errors });

  if (!rateLimit(clientIp(request.headers))) {
    return reply(429, { ok: false, error: 'rate_limited' });
  }

  const config = getMailConfig();
  if (!config) {
    console.error(
      'contact: mail env missing (RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL)',
    );
    return reply(503, { ok: false, error: 'unavailable' });
  }

  const location = LOCATIONS.includes(String(input.location))
    ? String(input.location)
    : 'unknown';
  const sent = await sendContactMail(config, result.value, location);
  return sent
    ? reply(200, { ok: true })
    : reply(503, { ok: false, error: 'unavailable' });
};
