// Sitemap helpers (work D9, blog D7): /work is a noindex empty state below MIN_PROJECTS published projects, so it must stay out
// of the sitemap too. astro.config.mjs cannot import the Keystatic reader, so this counts non-draft project
// folders on disk (same rule as src/lib/content.ts, including the SHOW_DRAFTS verification switch).
// Keep MIN_PROJECTS and MIN_POSTS in sync with src/lib/routes.ts.
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const MIN_PROJECTS = 2;
const MIN_POSTS = 3;

export function isWorkGated(dir = 'src/content/en/projects') {
  if (process.env.SHOW_DRAFTS === '1' || !existsSync(dir)) {
    return process.env.SHOW_DRAFTS === '1' ? false : true;
  }
  const published = readdirSync(dir, { withFileTypes: true }).filter(
    (d) =>
      d.isDirectory() &&
      existsSync(`${dir}/${d.name}/index.yaml`) &&
      !/^draft:\s*true\s*$/m.test(
        readFileSync(`${dir}/${d.name}/index.yaml`, 'utf8'),
      ),
  );
  return published.length < MIN_PROJECTS;
}

/** /blog is a noindex empty state below MIN_POSTS published posts (non-draft AND publishedAt <= today). */
export function isBlogGated(dir = 'src/content/en/posts') {
  if (process.env.SHOW_DRAFTS === '1') return false;
  if (!existsSync(dir)) return true;
  const today = new Date().toISOString().slice(0, 10);
  const published = readdirSync(dir, { withFileTypes: true }).filter((d) => {
    const file = `${dir}/${d.name}/index.mdoc`;
    if (!d.isDirectory() || !existsSync(file)) return false;
    const front = readFileSync(file, 'utf8').split(/^---\s*$/m)[1] ?? '';
    const date = /^publishedAt:\s*['"]?(\d{4}-\d{2}-\d{2})/m.exec(front)?.[1];
    return !/^draft:\s*true\s*$/m.test(front) && !!date && date <= today;
  });
  return published.length < MIN_POSTS;
}
