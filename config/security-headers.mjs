// @ts-check
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
      'astro:build:done': async ({ logger }) => {
        const file = new URL('../.vercel/output/config.json', import.meta.url);
        let config;
        try {
          config = JSON.parse(await readFile(file, 'utf-8'));
        } catch {
          throw new Error('security-headers: .vercel/output/config.json not found; is the Vercel adapter configured?');
        }
        config.routes = [
          { src: '/(.*)', headers: SECURITY_HEADERS, continue: true },
          ...(config.routes ?? []),
        ];
        await writeFile(file, JSON.stringify(config, null, 2));
        logger.info(`added ${Object.keys(SECURITY_HEADERS).length} security headers to the Vercel output config`);
      },
    },
  };
}
