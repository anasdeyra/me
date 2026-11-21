// Presentation model for posts (articles and notes): one typed view per Keystatic entry, plus series,
// related entries and the end-of-post CTA resolution (D3-D5). Never synthesises facts.
import type { ImageMetadata } from 'astro';
import { contentImage, getPosts, getTags } from './content';
import { byNewest, postEntry, projectEntry, type Entry } from './entries';
import { renderPost, type PostHeading } from './markdoc';
import { getProjectViews, type ProjectView } from './projects';

export const postTypes = ['article', 'note'] as const;
export type PostType = (typeof postTypes)[number];
export type CtaVariant = 'whatsapp' | 'project' | 'cv' | 'none';
export interface TagRef {
  slug: string;
  label: string;
}

export interface PostView {
  slug: string;
  href: string;
  title: string;
  type: PostType;
  description: string;
  tags: TagRef[];
  /** First pillar tag, drives the `auto` CTA. */
  pillar?: string;
  /** `YYYY-MM-DD`. */
  date: string;
  /** `YYYY-MM-DD`, only when it differs from `date`. */
  updated?: string;
  readingMinutes: number;
  series?: string;
  seriesOrder?: number;
  cover?: { image: ImageMetadata; alt: string };
  /** The `cta` field as authored (`auto` unresolved: see `resolveCta`). */
  ctaVariant: 'auto' | CtaVariant;
  canonicalUrl?: string;
  linkedinHook?: string;
  draft: boolean;
}

type PostItem = Awaited<ReturnType<typeof getPosts>>[number];

const text = (v: string | null | undefined) =>
  v && v.trim() ? v.trim() : undefined;

const WORDS_PER_MINUTE = 220;
export const readingTime = (words: number) =>
  Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));

/** Pillar tag -> CTA for `cta: auto` (D5). */
export const pillarCta: Record<string, CtaVariant> = {
  'for-founders': 'whatsapp',
  engineering: 'project',
};

// Rendering is memoised per slug: views need the word count, pages need the HTML.
const rendered = new Map<string, ReturnType<typeof renderPost>>();
const render = (item: PostItem) => {
  let r = rendered.get(item.slug);
  if (!r) rendered.set(item.slug, (r = renderPost(item.entry.body)));
  return r;
};

async function postView(
  item: PostItem,
  labels: Map<string, { label: string; pillar: boolean }>,
): Promise<PostView> {
  const { slug, entry } = item;
  const type = entry.type.discriminant as PostType;
  const coverAlt =
    entry.type.discriminant === 'article'
      ? text(entry.type.value.coverAlt)
      : undefined;
  const coverFile =
    entry.type.discriminant === 'article' && coverAlt
      ? contentImage(`en/posts/${slug}`, entry.type.value.cover)
      : undefined;
  const tags = entry.tags
    .filter((s): s is string => !!s)
    .map((s) => ({ slug: s, label: labels.get(s)?.label ?? s }));
  const { words } = await render(item);
  return {
    slug,
    href: `/blog/${slug}`,
    title: entry.title,
    type,
    description: entry.description,
    tags,
    pillar: tags.find((t) => labels.get(t.slug)?.pillar)?.slug,
    date: entry.publishedAt,
    updated:
      entry.updatedAt && entry.updatedAt !== entry.publishedAt
        ? entry.updatedAt
        : undefined,
    readingMinutes: readingTime(words),
    series: text(entry.series),
    seriesOrder: entry.seriesOrder ?? undefined,
    cover:
      coverFile && coverAlt ? { image: coverFile, alt: coverAlt } : undefined,
    ctaVariant: entry.cta,
    canonicalUrl: text(entry.canonicalUrl),
    linkedinHook: text(entry.linkedinHook),
    draft: !!entry.draft,
  };
}

let views: Promise<PostView[]> | undefined;

/** Every visible post (drafts and future posts per the content.ts rule), newest first. */
export function getPostViews(): Promise<PostView[]> {
  return (views ??= (async () => {
    const [items, tags] = await Promise.all([getPosts(), getTags()]);
    const labels = new Map(
      tags.map((t) => [
        t.slug,
        { label: t.entry.label, pillar: !!t.entry.pillar },
      ]),
    );
    return Promise.all(items.map((i) => postView(i, labels)));
  })());
}

/** The post with its rendered body and headings (H2/H3 with ids), or undefined. */
export async function getPostBySlug(
  slug: string,
): Promise<
  { view: PostView; html: string; headings: PostHeading[] } | undefined
> {
  const [all, items] = await Promise.all([getPostViews(), getPosts()]);
  const view = all.find((p) => p.slug === slug);
  const item = items.find((p) => p.slug === slug);
  if (!view || !item) return undefined;
  const { html, headings } = await render(item);
  return { view, html, headings };
}

export interface SeriesInfo {
  name: string;
  /** 1-based position of the current post among the published parts. */
  part: number;
  total: number;
  parts: { slug: string; href: string; title: string; current: boolean }[];
  prev?: { href: string; title: string };
  next?: { href: string; title: string };
}

/** Series navigation (D4): undefined unless at least two parts are published. */
export async function getSeries(
  post: PostView,
): Promise<SeriesInfo | undefined> {
  if (!post.series) return undefined;
  const members = (await getPostViews())
    .filter((p) => p.series === post.series)
    .sort(
      (a, b) =>
        (a.seriesOrder ?? Infinity) - (b.seriesOrder ?? Infinity) ||
        a.date.localeCompare(b.date),
    );
  if (members.length < 2) return undefined;
  const i = members.findIndex((p) => p.slug === post.slug);
  if (i < 0) return undefined;
  const link = (p: PostView) => ({ href: p.href, title: p.title });
  return {
    name: post.series,
    part: i + 1,
    total: members.length,
    parts: members.map((p) => ({
      slug: p.slug,
      href: p.href,
      title: p.title,
      current: p.slug === post.slug,
    })),
    prev: i > 0 ? link(members[i - 1]) : undefined,
    next: i < members.length - 1 ? link(members[i + 1]) : undefined,
  };
}

/** Published posts and projects sharing tags with the post (score = shared tags, newest wins ties), max `max`. */
export async function getRelatedEntries(
  post: PostView,
  max = 3,
): Promise<Entry[]> {
  const [posts, projects] = await Promise.all([
    getPostViews(),
    getProjectViews(),
  ]);
  const mine = new Set(post.tags.map((t) => t.slug));
  const seriesSlugs = new Set(
    (await getSeries(post))?.parts.map((p) => p.slug) ?? [],
  );
  const candidates = [
    ...posts
      .filter((p) => p.slug !== post.slug && !seriesSlugs.has(p.slug))
      .map(postEntry),
    ...projects.map(projectEntry),
  ];
  return candidates
    .map((entry) => ({
      entry,
      score: entry.tags.filter((s) => mine.has(s)).length,
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || byNewest(a.entry, b.entry))
    .slice(0, max)
    .map((c) => c.entry);
}

/** The first published project sharing a tag with the post (for the `project` CTA). */
export async function getRelatedProject(
  post: PostView,
): Promise<ProjectView | undefined> {
  const mine = new Set(post.tags.map((t) => t.slug));
  return (await getProjectViews()).find((p) =>
    p.tagRefs.some((t) => mine.has(t.slug)),
  );
}

/** Resolve `auto` by pillar tag (D5). `project` degrades to WhatsApp in EndCta when no project matches. */
export function resolveCta(post: PostView): CtaVariant {
  if (post.ctaVariant !== 'auto') return post.ctaVariant;
  return (post.pillar && pillarCta[post.pillar]) || 'whatsapp';
}
