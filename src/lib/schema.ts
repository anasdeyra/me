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
export function websiteNode(
  s: Settings,
  opts: { withPublisher?: boolean } = {},
): SchemaNode {
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

/** Minimal WebSite (name + url) sharing the full node's @id, for pages whose nodes reference it via `isPartOf`. */
export function websiteRefNode(s: Settings): SchemaNode {
  return {
    '@type': 'WebSite',
    '@id': schemaIds.website,
    url: root,
    name: s.brand,
  };
}

/** The person behind the site. Use on pages that visibly present Anas (home hero, /about, /cv). */
export function personNode(
  s: Settings,
  p: Profile,
  opts: { image?: string } = {},
): SchemaNode {
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

/**
 * Minimal Person (name + url) sharing the full node's @id. Add it to pages whose nodes reference the author by @id
 * (posts, projects, collections) so a crawler reading that page alone can resolve the author.
 */
export function personRefNode(s: Settings): SchemaNode {
  return {
    '@type': 'Person',
    '@id': schemaIds.person,
    name: s.name,
    url: root,
  };
}

/** `ProfilePage` for /about: the page is about the Person node (referenced by @id, so define it on the page too). */
export function profilePageNode(
  _s: Settings,
  _p: Profile,
  opts: {
    url: string;
    name: string;
    description: string;
    dateModified?: string;
  },
): SchemaNode {
  return {
    '@type': 'ProfilePage',
    '@id': `${opts.url}#profilepage`,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    inLanguage: 'en',
    isPartOf: { '@id': schemaIds.website },
    mainEntity: { '@id': schemaIds.person },
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
  };
}

type SchemaProject = {
  title: string;
  outcome: string;
  type: 'client' | 'side' | 'research';
  year?: number;
  stack: string[];
  tags: string[];
  links: { kind: string; href: string }[];
};

/**
 * Project page: `CreativeWork`; research with a paper link is a `ScholarlyArticle` (`sameAs` = paper).
 * Only visible facts: `year` only when displayed. `image` is the hero, else the page's OG card (its declared og:image).
 */
export function creativeWorkNode(
  p: SchemaProject,
  opts: { url: string; image?: string },
): SchemaNode {
  const paper = p.links.find((l) => l.kind === 'paper')?.href;
  const keywords = [...p.stack, ...p.tags];
  return {
    '@type':
      p.type === 'research' && paper ? 'ScholarlyArticle' : 'CreativeWork',
    '@id': `${opts.url}#project`,
    url: opts.url,
    name: p.title,
    description: p.outcome,
    inLanguage: 'en',
    author: { '@id': schemaIds.person },
    isPartOf: { '@id': schemaIds.website },
    ...(keywords.length ? { keywords: keywords.join(', ') } : {}),
    ...(p.year ? { dateCreated: String(p.year) } : {}),
    ...(paper ? { sameAs: paper } : {}),
    ...(opts.image ? { image: opts.image } : {}),
  };
}

/** `BreadcrumbList`: must match the visible breadcrumb. `url` of the last item is optional. */
export function breadcrumbNode(
  items: { name: string; url: string }[],
): SchemaNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** `CollectionPage` for an index such as /work. */
export function collectionPageNode(opts: {
  url: string;
  name: string;
  description: string;
}): SchemaNode {
  return {
    '@type': 'CollectionPage',
    '@id': `${opts.url}#collection`,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    inLanguage: 'en',
    isPartOf: { '@id': schemaIds.website },
    author: { '@id': schemaIds.person },
  };
}

/**
 * `BlogPosting` for an article or note. `image` is the page's OG card (its declared og:image), `dateModified` is the
 * update date, else the publish date. `keywords` are the visible tag labels.
 */
export function blogPostingNode(opts: {
  url: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  tags?: string[];
  image?: string;
  wordCount?: number;
}): SchemaNode {
  return {
    '@type': 'BlogPosting',
    '@id': `${opts.url}#post`,
    url: opts.url,
    mainEntityOfPage: opts.url,
    headline: opts.title,
    description: opts.description,
    inLanguage: 'en',
    datePublished: opts.datePublished,
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
    author: { '@id': schemaIds.person },
    publisher: { '@id': schemaIds.person },
    isPartOf: { '@id': schemaIds.website },
    ...(opts.tags?.length ? { keywords: opts.tags.join(', ') } : {}),
    ...(opts.image ? { image: opts.image } : {}),
    ...(opts.wordCount ? { wordCount: opts.wordCount } : {}),
  };
}

/** `CollectionPage` for a tag page, listing the visible entries. */
export function tagCollectionNode(opts: {
  url: string;
  name: string;
  description: string;
  items: { url: string; name: string }[];
}): SchemaNode {
  return {
    ...collectionPageNode(opts),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: opts.items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: item.url,
        name: item.name,
      })),
    },
  };
}
