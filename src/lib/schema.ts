// JSON-LD builders (schema.org). Nodes share stable @ids so pages can reference each other.
// Only mark up what the page visibly shows (Google guideline). FAQPage is intentionally unused:
// Google retired FAQ rich results in 2026.
import type { getProfile, getSettings } from './content';

type Settings = Awaited<ReturnType<typeof getSettings>>;
type Profile = Awaited<ReturnType<typeof getProfile>>;
export type SchemaNode = Record<string, unknown>;

const site = new URL(import.meta.env.SITE);
const root = site.href; // https://deyra.dev/

export const schemaIds = {
  website: `${root}#website`,
  person: `${root}#person`,
};

/** Site identity (Google uses name/alternateName for the site name in results). Home page. */
export function websiteNode(s: Settings, opts: { withPublisher?: boolean } = {}): SchemaNode {
  return {
    '@type': 'WebSite',
    '@id': schemaIds.website,
    url: root,
    name: s.brand,
    alternateName: [s.name, site.host],
    inLanguage: 'en',
    ...(opts.withPublisher ? { publisher: { '@id': schemaIds.person } } : {}),
  };
}

/** The person behind the site. Use on pages that visibly present Anas (home hero, /about, /cv). */
export function personNode(s: Settings, p: Profile, opts: { image?: string } = {}): SchemaNode {
  return {
    '@type': 'Person',
    '@id': schemaIds.person,
    name: s.name,
    alternateName: s.brand,
    url: root,
    jobTitle: p.title,
    description: p.shortBio,
    email: `mailto:${s.email}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: s.location.city,
      addressCountry: s.location.countryCode,
    },
    knowsLanguage: s.languages.map((l) => l.code),
    sameAs: [s.links.linkedin, s.links.github, s.links.upwork],
    ...(opts.image ? { image: opts.image } : {}),
  };
}
