// @ts-check
import { existsSync } from 'node:fs';
import { readdir, readFile, rm } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** @param {string} dir @returns {Promise<string[]>} */
async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/**
 * Builds the Pagefind index over the prerendered pages (Astro's client output, `dir`) and writes it to
 * /pagefind; the Vercel adapter then copies the folder into .vercel/output/static. Only <main> is indexed
 * (`rootSelector`), so header/footer/nav text never matches. Pages with `<meta name="robots" content="noindex">`
 * (404, contact/sent, contact/error, the empty /blog) are skipped: Pagefind's body-level data-pagefind-ignore does
 * not apply when the root is <main>, so the filter lives here. URLs are registered clean (no index.html, no
 * trailing slash). Must be listed before securityHeaders.
 * @returns {import('astro').AstroIntegration}
 */
export function searchIndex() {
  return {
    name: 'search-index',
    hooks: {
      'astro:build:done': async ({ logger, dir: dirUrl }) => {
        const dir = fileURLToPath(dirUrl);
        if (!existsSync(dir)) {
          logger.warn(`no ${dir}, search index skipped`);
          return;
        }
        const pagefind = await import('pagefind');
        const { index, errors: createErrors } = await pagefind.createIndex({
          rootSelector: 'main',
          forceLanguage: 'en',
        });
        if (!index) {
          logger.warn(`search index skipped: ${createErrors.join('; ')}`);
          return;
        }
        try {
          let pages = 0;
          let skipped = 0;
          for (const file of await htmlFiles(dir)) {
            const content = await readFile(file, 'utf-8');
            if (/<meta name="robots" content="[^"]*noindex/.test(content)) {
              skipped++;
              continue;
            }
            const path = relative(dir, file)
              .split(sep)
              .join('/')
              .replace(/(^|\/)index\.html$/, '')
              .replace(/\.html$/, '');
            const { errors } = await index.addHTMLFile({
              url: `/${path}`,
              content,
            });
            if (errors.length) logger.warn(`${file}: ${errors.join('; ')}`);
            else pages++;
          }
          const written = await index.writeFiles({
            outputPath: join(dir, 'pagefind'),
          });
          if (written.errors.length) logger.warn(written.errors.join('; '));
          // The site ships its own dialog: drop Pagefind's prebuilt UI and highlight bundles (dead public files).
          for (const f of await readdir(join(dir, 'pagefind'))) {
            if (/^pagefind-(?:[a-z-]*ui|highlight)\./.test(f))
              await rm(join(dir, 'pagefind', f));
          }
          logger.info(`indexed ${pages} pages (${skipped} noindex skipped)`);
        } finally {
          await pagefind.close();
        }
      },
    },
  };
}
