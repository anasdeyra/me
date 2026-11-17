// @ts-check
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

/**
 * Site-wide security headers. The CSP is not here: Astro generates it (with script/style
 * hashes) and the Vercel adapter emits it per page via `staticHeaders`.
 */
export const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
};

/**
 * Adds SECURITY_HEADERS to every response by prepending a route to Vercel's
 * Build Output config (.vercel/output/config.json) after the adapter writes it.
 * Must be listed after the adapter so its build:done hook runs later.
 * @returns {import('astro').AstroIntegration}
 */
export function securityHeaders() {
  return {
    name: 'security-headers',
    hooks: {
      'astro:build:done': async ({ logger, dir }) => {
        const file = new URL('../.vercel/output/config.json', import.meta.url);
        let config;
        try {
          config = JSON.parse(await readFile(file, 'utf-8'));
        } catch {
          throw new Error(
            'security-headers: .vercel/output/config.json not found; is the Vercel adapter configured?',
          );
        }
        await addInlineScriptHashes(config, dir, logger);
        addNotFoundCsp(config, logger);
        config.routes = [
          { src: '/(.*)', headers: SECURITY_HEADERS, continue: true },
          ...(config.routes ?? []),
        ];
        await writeFile(file, JSON.stringify(config, null, 2));
        logger.info(
          `added ${Object.keys(SECURITY_HEADERS).length} security headers to the Vercel output config`,
        );
      },
    },
  };
}

/**
 * Unknown URLs are served `/404.html` by the final catch-all route, which no per-page CSP route matches (those match the
 * literal path `/404`). Copy the /404 page's CSP onto the catch-all so a real 404 is as protected as the page itself.
 * @param {{ routes?: any[] }} config
 * @param {import('astro').AstroIntegrationLogger} logger
 */
function addNotFoundCsp(config, logger) {
  const routes = config.routes ?? [];
  const csp = routes.find((r) => r.src === '/404')?.headers?.[
    'content-security-policy'
  ];
  const catchAll = routes.find(
    (r) => r.dest === '/404.html' && r.status === 404,
  );
  if (!csp || !catchAll) {
    logger.warn('security-headers: no /404 CSP or catch-all route to link');
    return;
  }
  catchAll.headers = {
    ...catchAll.headers,
    'content-security-policy': csp,
  };
}

/**
 * Hashes added by components through `Astro.csp.insertScriptHash` (ThemeScript, Analytics) never reach the
 * per-route CSP once the project has an on-demand route (e.g. /api/contact): the adapter then only emits the
 * hashes Astro itself collected. So read every prerendered page, hash its executable inline scripts and add
 * the hashes to that route's script-src. Idempotent: hashes already present are skipped.
 * @param {{ routes?: any[] }} config
 * @param {URL} dir prerendered pages (Astro's client output, copied to .vercel/output/static)
 * @param {import('astro').AstroIntegrationLogger} logger
 */
async function addInlineScriptHashes(config, dir, logger) {
  let added = 0;
  for (const route of config.routes ?? []) {
    const csp = route.headers?.['content-security-policy'];
    const match = /^\/([\w/-]*)$/.exec(route.src ?? '');
    if (!csp || !match) continue;
    const path = match[1];
    const candidates = path
      ? [`${path}/index.html`, `${path}.html`]
      : ['index.html'];
    let html;
    for (const candidate of candidates) {
      try {
        html = await readFile(new URL(candidate, dir), 'utf-8');
        break;
      } catch {}
    }
    if (html === undefined) continue;
    const hashes = new Set();
    for (const [, attrs, body] of html.matchAll(
      /<script([^>]*)>([\s\S]*?)<\/script>/g,
    )) {
      if (
        /\bsrc=/.test(attrs) ||
        /type="application\/(ld\+)?json"/.test(attrs) ||
        !body
      )
        continue;
      hashes.add(
        `'sha256-${createHash('sha256').update(body).digest('base64')}'`,
      );
    }
    const styleHashes = new Set();
    for (const [, , body] of html.matchAll(
      /<style([^>]*)>([\s\S]*?)<\/style>/g,
    )) {
      if (body)
        styleHashes.add(
          `'sha256-${createHash('sha256').update(body).digest('base64')}'`,
        );
    }
    // Pagefind compiles WebAssembly: allow 'wasm-unsafe-eval' (not 'unsafe-eval') on pages that contain the
    // search dialog only (src/components/site/Search.astro).
    const needsWasm =
      html.includes('data-search-dialog') &&
      !/script-src [^;]*'wasm-unsafe-eval'/.test(csp);
    const missing = [...hashes].filter((h) => !csp.includes(h));
    const missingStyle = [...styleHashes].filter((h) => !csp.includes(h));
    if (!missing.length && !missingStyle.length && !needsWasm) continue;
    let next = csp;
    if (needsWasm)
      next = next.replace(
        /script-src [^;]*/,
        (/** @type {string} */ d) => `${d} 'wasm-unsafe-eval'`,
      );
    if (missing.length)
      next = next.replace(
        /script-src [^;]*/,
        (/** @type {string} */ d) => `${d} ${missing.join(' ')}`,
      );
    if (missingStyle.length)
      next = next.replace(
        /style-src [^;]*/,
        (/** @type {string} */ d) => `${d} ${missingStyle.join(' ')}`,
      );
    route.headers['content-security-policy'] = next;
    added += missing.length + missingStyle.length;
  }
  if (added)
    logger.info(`added ${added} inline script/style hashes to the route CSPs`);
}
