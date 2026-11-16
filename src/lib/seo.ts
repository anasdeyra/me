/** Canonical URL for a path: no trailing slash (except root), no `.html`, no `/index`. */
export function canonicalUrl(pathname: string, site: URL): string {
  const clean = pathname.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/(.)\/+$/, '$1');
  return new URL(clean || '/', site).href;
}
