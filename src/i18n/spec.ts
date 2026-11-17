/**
 * Strings of the Spec mode panel. Kept apart from en.ts because the lazy Spec chunk imports only this file
 * (the whole dictionary would ship to it); en.ts spreads it in, so `t('spec.p....')` works everywhere.
 * Overlay labels are measurements (px, ratios, token names) and need no translation.
 */
export const specEn = {
  'spec.p.weight': 'Page weight',
  'spec.p.weight.note':
    'Compressed size of what this page has loaded so far, updated as more loads. Cached files show their stored size.',
  'spec.p.dev': 'Development build: sizes are not representative.',
  'spec.p.html': 'HTML',
  'spec.p.css': 'CSS',
  'spec.p.js': 'JavaScript',
  'spec.p.font': 'Fonts',
  'spec.p.image': 'Images',
  'spec.p.other': 'Other',
  'spec.p.total': 'Total',
  'spec.p.nocompress':
    'This server sends files uncompressed, so budget verdicts are skipped. Production compresses them.',
  'spec.p.rawsize': '{size} unpacked',
  'spec.p.self': 'Spec mode (extra)',
  'spec.p.budget.within': 'within budget',
  'spec.p.budget.over': 'over budget by {size}',
  'spec.p.budget.htmlcss': 'HTML and CSS: {used} of {max}, {verdict}',
  'spec.p.budget.js':
    'JavaScript loaded so far: {used} of {max} (budget before interaction), {verdict}',
  'spec.p.na': 'Not available in this browser.',
  'spec.p.lighthouse': 'Lighthouse',
  'spec.p.lighthouse.meta': '{preset}, {date}',
  'spec.p.lh.performance': 'Performance',
  'spec.p.lh.accessibility': 'Accessibility',
  'spec.p.lh.bestPractices': 'Best practices',
  'spec.p.lh.seo': 'SEO',
  'spec.p.headers': 'Security headers',
  'spec.p.headers.count': '{n} of {total} present',
  'spec.p.headers.none':
    'None sent by this server. Dev and plain static servers send none; the production host does.',
  'spec.p.headers.failed': "Could not read this page's response headers.",
  'spec.p.headers.present': 'present',
  'spec.p.headers.missing': 'missing',
  'spec.p.headers.loading': 'Checking...',
  'spec.p.headers.safe': 'script-src without unsafe-inline or unsafe-eval',
  'spec.p.outline': 'Outline',
  'spec.p.outline.empty': 'No landmarks or headings found.',
  'spec.p.outline.skip': 'skips a level',
  'spec.p.items': 'On this page',
  'spec.p.items.empty': 'Nothing on this page is annotated.',
  'spec.p.items.more': '{n} more not listed',
  'spec.p.items.hint':
    'Same numbers as the labels drawn on the page. Enter jumps to the item.',
  'spec.p.small':
    'The overlay needs a wider screen. The lists below hold the same measurements.',
  'spec.p.keys': 'Keyboard',
  'spec.p.key.s': 'Turn Spec mode on or off',
  'spec.p.key.esc': 'Collapse this panel, focus returns to the toggle',
  'spec.p.key.tab': 'Move through the panel',
  'spec.p.key.enter': 'Jump to the item on the page',
  // Measurement vocabulary (overlay chips and the "On this page" list)
  'spec.m.ok': 'ok',
  'spec.m.small': 'small',
  'spec.m.min': 'min {n}',
  'spec.m.target': 'target',
  'spec.m.contrast': 'contrast',
  'spec.m.padding': 'padding-block',
  'spec.m.gap': '{n}px below the previous block',
  'spec.m.tracking': 'tracking',
  'spec.m.measure': 'measure',
  'spec.m.cols': '{n} col, gap {gap}',
  'spec.m.cols.detail': '{n} columns of {col}px, gap {gap}px',
  'spec.m.loading': 'loading',
  'spec.m.fetchpriority': 'fetchpriority',
  'spec.m.imgwait': 'image not loaded yet',
  'spec.m.noimage': 'over image: not computed',
  'spec.m.na': 'n/a',
  'spec.m.fail': 'fail (needs {n}:1)',
  'spec.m.pass': 'pass',
} as const;

export type SpecKey = keyof typeof specEn;

/** Fill `{name}` placeholders (same rule as t(), without pulling in the full dictionary). */
export function st(key: SpecKey, vars: Record<string, string | number> = {}) {
  return specEn[key].replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}
