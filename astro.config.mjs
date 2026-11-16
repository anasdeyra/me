// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// Keystatic admin (/keystatic) is a local-only tool: load it in `astro dev` only,
// so its routes and API are never part of the production build.
const isDev =
  process.argv.includes('dev') || process.env.NODE_ENV === 'development';

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? 'https://example.com',
  // Static by default; opt single routes into SSR with `export const prerender = false`.
  adapter: vercel(),
  integrations: [react(), ...(isDev ? [markdoc(), keystatic()] : [])],
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
