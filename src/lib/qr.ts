// QR code as a single SVG path built at build time (no runtime library, CSP-safe: only attributes).
import { encode } from 'uqr';

/**
 * `<svg viewBox={viewBox}><path d={path} fill="currentColor" /></svg>`. One 1x1 unit per module; `quiet` is the
 * blank border in modules (the QR spec asks for 4). `size` is the total width in modules including the border.
 */
export function qrSvg(
  value: string,
  opts: { quiet?: number } = {},
): { viewBox: string; path: string; size: number } {
  const quiet = opts.quiet ?? 4;
  const { data, size: modules } = encode(value, { border: 0, ecc: 'M' });
  const size = modules + quiet * 2;
  let path = '';
  data.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < row.length && row[x]) x++;
      // One rectangle per horizontal run of dark modules.
      path += `M${start + quiet} ${y + quiet}h${x - start}v1h-${x - start}z`;
    }
  });
  return { viewBox: `0 0 ${size} ${size}`, path, size };
}
