// Measures the production build with Lighthouse and writes src/data/lighthouse.json, which the Spec panel shows
// (with its date) for the audited paths. Numbers always come from this script, never from hand edits.
//
//   pnpm build && node scripts/lighthouse.mjs [path ...]     (default: the list below)
//
// Lighthouse is not a dependency: it runs through `pnpm dlx lighthouse@<pinned>`. Needs Google Chrome
// (CHROME_PATH or /usr/bin/google-chrome). Mobile preset (Lighthouse default: Moto G Power, simulated 4G slow
// throttling) against a local static server that sends the real route headers, so scores are "lab, local build"
// and exclude the CDN. Sets of paths that do not exist in the build are skipped.
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { serve } from './serve-static.mjs';

const run = promisify(execFile);
const LIGHTHOUSE = 'lighthouse@12.8.2';
const CHROME = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const STATIC = '.vercel/output/static';
const OUT = 'src/data/lighthouse.json';
const DEFAULT_PATHS = ['/', '/about', '/cv', '/contact', '/work', '/blog'];
const CATEGORIES = {
  performance: 'performance',
  accessibility: 'accessibility',
  bestPractices: 'best-practices',
  seo: 'seo',
};
const PRESET = 'mobile, simulated throttling, local build';

/** Throws unless `data` has the shape src/scripts/spec/page.ts reads. */
export function validate(data) {
  const fail = (m) => {
    throw new Error(`lighthouse.json: ${m}`);
  };
  if (!data || typeof data !== 'object') fail('not an object');
  if (
    Number.isNaN(Date.parse(data.generatedAt)) ||
    !/^\d{4}-\d\d-\d\dT/.test(data.generatedAt)
  )
    fail('generatedAt is not an ISO date');
  for (const k of ['lighthouse', 'preset'])
    if (typeof data[k] !== 'string' || !data[k]) fail(`${k} missing`);
  const entries = Object.entries(data.pages ?? {});
  if (!entries.length) fail('no pages');
  for (const [p, s] of entries) {
    if (!p.startsWith('/')) fail(`bad path ${p}`);
    for (const k of Object.keys(CATEGORIES))
      if (!Number.isInteger(s?.[k]) || s[k] < 0 || s[k] > 100)
        fail(`${p}.${k} is not an integer 0-100`);
  }
}

const paths = process.argv.slice(2).length
  ? process.argv.slice(2)
  : DEFAULT_PATHS;
if (!fs.existsSync(path.join(STATIC, 'index.html')))
  throw new Error(`No build at ${STATIC}: run pnpm build first.`);

const { server, port } = await serve(STATIC);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lh-'));
const pages = {};
let version = '';
try {
  for (const p of paths) {
    const file = path.join(tmp, `${p.replace(/\W+/g, '_')}.json`);
    process.stdout.write(`${p} ... `);
    await run(
      'pnpm',
      [
        'dlx',
        LIGHTHOUSE,
        `http://127.0.0.1:${port}${p}`,
        '--output=json',
        `--output-path=${file}`,
        `--only-categories=${Object.values(CATEGORIES).join(',')}`,
        `--chrome-path=${CHROME}`,
        '--chrome-flags=--headless=new',
        '--quiet',
      ],
      { maxBuffer: 64 * 1024 * 1024 },
    );
    const lhr = JSON.parse(fs.readFileSync(file, 'utf8'));
    version = lhr.lighthouseVersion;
    if (lhr.runtimeError || (lhr.categories.performance.score ?? null) === null)
      throw new Error(
        `${p}: Lighthouse reported ${lhr.runtimeError?.message ?? 'no score'}`,
      );
    pages[p] = Object.fromEntries(
      Object.entries(CATEGORIES).map(([k, id]) => [
        k,
        Math.round(lhr.categories[id].score * 100),
      ]),
    );
    console.log(JSON.stringify(pages[p]));
  }
} finally {
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}

const data = {
  generatedAt: new Date().toISOString(),
  lighthouse: version,
  preset: PRESET,
  pages,
};
validate(data);
fs.writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);
console.log(`wrote ${OUT} (${Object.keys(pages).length} pages)`);
