// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { securityHeaders } from './config/security-headers.mjs';

// Keystatic admin (/keystatic) is a local-only tool: load it in `astro dev` only,
// so its routes and API are never part of the production build.
const isDev =
  process.argv.includes('dev') || process.env.NODE_ENV === 'development';

/**
 * Dev-only design lab at /lab (font and direction experiments). Never built for production.
 * @type {import('astro').AstroIntegration}
 */
const devLab = {
  name: 'dev-lab',
  hooks: {
    'astro:config:setup': ({ injectRoute }) => {
      injectRoute({
        pattern: '/lab',
        entrypoint: new URL('./src/dev/lab/Lab.astro', import.meta.url),
      });
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: 'https://deyra.dev',
  // Clean URLs: /work, not /work/. The adapter maps this to Vercel (308 from the slashed form).
  trailingSlash: 'never',
  // Static by default; opt single routes into SSR with `export const prerender = false`.
  // staticHeaders: send the CSP as a real HTTP header (needed for frame-ancestors), not a <meta>.
  adapter: vercel({ staticHeaders: true }),
  integrations: [
    react(),
    sitemap(),
    ...(isDev ? [markdoc(), keystatic(), devLab] : []),
    // Last, so it runs after the adapter has written .vercel/output/config.json.
    securityHeaders(),
  ],
  security: {
    // Enforced CSP in production builds: Astro hashes every script and style it renders; no 'unsafe-inline'.
    // Off in dev: Astro would send it there too, without hashes, blocking Vite's inline dev styles,
    // the Keystatic admin and the /lab fonts. Verify CSP on a Vercel preview deployment instead.
    csp: isDev ? false : {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "manifest-src 'self'",
        'upgrade-insecure-requests',
      ],
    },
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
    routing: { prefixDefaultLocale: false },
  },
  markdown: {
    // Shiki emits inline styles that the strict CSP blocks; blog code highlighting (Phase 4)
    // must be CSP-safe (class-based output).
    syntaxHighlight: false,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
