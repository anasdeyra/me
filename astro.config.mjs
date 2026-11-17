// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { searchIndex } from './config/search-index.mjs';
import { securityHeaders } from './config/security-headers.mjs';
import { isBlogGated, isWorkGated } from './config/content-gate.mjs';

const workGated = isWorkGated();
const blogGated = isBlogGated();

// Keystatic admin (/keystatic) is a local-only tool: load it in `astro dev` only,
// so its routes and API are never part of the production build.
const isDev =
  process.argv.includes('dev') || process.env.NODE_ENV === 'development';

// Self-hosted fonts from the installed @fontsource-variable packages (pinned by the lockfile, no network
// at build). Latin subset only: one variable woff2 per family covers every weight.
/** @param {string} pkg @param {string} file */
const fontFile = (pkg, file) =>
  `./node_modules/@fontsource-variable/${pkg}/files/${file}`;

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
    // Result pages of the contact form are noindex, so keep them out of the sitemap too.
    sitemap({
      filter: (page) =>
        !/\/contact\/(sent|error)\/?$/.test(page) &&
        !(workGated && /\/work\/?$/.test(page)) &&
        !(blogGated && /\/blog\/?$/.test(page)),
    }),
    ...(isDev ? [markdoc(), keystatic()] : []),
    // After the adapter has copied the static output; before securityHeaders (which reads the HTML).
    searchIndex(),
    // Last, so it runs after the adapter has written .vercel/output/config.json.
    securityHeaders(),
  ],
  security: {
    // Enforced CSP in production builds: Astro hashes every script and style it renders; no 'unsafe-inline'.
    // Off in dev: Astro would send it there too, without hashes, blocking Vite's inline dev styles,
    // and the Keystatic admin. Verify CSP on a Vercel preview deployment instead.
    csp: isDev
      ? false
      : {
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
  // Fonts API: files are copied to /_astro/fonts and a metric-matched fallback (@font-face over a local
  // system font) is generated, so the swap does not shift layout.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Geist',
      cssVariable: '--font-geist',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          {
            src: [fontFile('geist', 'geist-latin-wght-normal.woff2')],
            weight: '100 900',
            style: 'normal',
          },
        ],
      },
    },
    {
      // Code and Spec mode only; never preloaded.
      provider: fontProviders.local(),
      name: 'Geist Mono',
      cssVariable: '--font-geist-mono',
      fallbacks: ['monospace'],
      options: {
        variants: [
          {
            src: [fontFile('geist-mono', 'geist-mono-latin-wght-normal.woff2')],
            weight: '100 900',
            style: 'normal',
          },
        ],
      },
    },
  ],
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
    // Astro's `auto` inlining: page-specific sheets up to 8 KB (e.g. the below-the-fold ClientsMap) become
    // hashed inline <style>, not render-blocking requests. The shared layout sheet stays external (cacheable).
    build: { assetsInlineLimit: 8192 },
    plugins: [tailwindcss()],
  },
});
