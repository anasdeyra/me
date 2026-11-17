// Static server over the production build with the real per-route headers from .vercel/output/config.json
// (CSP, HSTS, ...). Used by scripts/lighthouse.mjs; also handy for manual checks:
//   node scripts/serve-static.mjs [dir] [port]
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
};

const COMPRESSIBLE = new Set([
  '.html',
  '.css',
  '.js',
  '.json',
  '.svg',
  '.xml',
  '.txt',
]);
const cache = new Map();

/** Brotli or gzip by Accept-Encoding, like Vercel's edge (cached per file + mtime). */
function encode(file, accept) {
  const enc = /\bbr\b/.test(accept)
    ? 'br'
    : /\bgzip\b/.test(accept)
      ? 'gzip'
      : null;
  if (!enc) return null;
  const key = `${enc}:${file}:${fs.statSync(file).mtimeMs}`;
  if (!cache.has(key)) {
    const raw = fs.readFileSync(file);
    cache.set(
      key,
      enc === 'br'
        ? zlib.brotliCompressSync(raw, {
            params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
          })
        : zlib.gzipSync(raw, { level: 9 }),
    );
  }
  return { enc, body: cache.get(key) };
}

/** Starts the server; resolves with `{ server, port }` (port 0 picks a free one). */
export function serve(root, port = 0) {
  const dir = path.resolve(root);
  const config = path.join(dir, '../config.json');
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const headers = {};
    for (const r of JSON.parse(fs.readFileSync(config, 'utf8')).routes) {
      // Terminal routes (redirects, the 404 catch-all) only apply when no file matches, as on Vercel.
      if (!r.headers || !r.src || r.dest || r.status) continue;
      try {
        if (new RegExp(`^${r.src}$`).test(p)) Object.assign(headers, r.headers);
      } catch {
        /* a route pattern JS cannot parse: skip */
      }
    }
    // LOCAL EMULATION ONLY: on Vercel, /_vercel/insights/script.js is served by the platform when Web
    // Analytics is enabled. Locally it would 404 and Lighthouse best-practices would flag a console
    // error that production does not have. Answer with an empty script. Nothing is added to the build.
    if (p === '/_vercel/insights/script.js') {
      res.writeHead(200, { ...headers, 'content-type': TYPES['.js'] });
      return res.end('');
    }
    for (const c of [p, `${p}/index.html`, `${p}.html`]) {
      const f = path.join(dir, c);
      if (f.startsWith(dir) && fs.existsSync(f) && fs.statSync(f).isFile()) {
        const ext = path.extname(f);
        const base = {
          ...headers,
          'content-type': TYPES[ext] ?? 'application/octet-stream',
        };
        const z = COMPRESSIBLE.has(ext)
          ? encode(f, String(req.headers['accept-encoding'] ?? ''))
          : null;
        if (z) {
          res.writeHead(200, {
            ...base,
            'content-encoding': z.enc,
            vary: 'Accept-Encoding',
            'content-length': z.body.length,
          });
          return res.end(z.body);
        }
        res.writeHead(200, base);
        return fs.createReadStream(f).pipe(res);
      }
    }
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  });
  return new Promise((resolve) =>
    server.listen(port, '127.0.0.1', () =>
      resolve({ server, port: server.address().port }),
    ),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { port } = await serve(
    process.argv[2] ?? '.vercel/output/static',
    +process.argv[3] || 4401,
  );
  console.log(`http://127.0.0.1:${port}`);
}
