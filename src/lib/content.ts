// Typed build-time access to Keystatic content. Pages call these helpers instead of the
// reader directly, so draft filtering, sorting and locale routing live in one place.
import type { ImageMetadata } from 'astro';
import type { Locale } from '@/i18n';
import { reader } from './reader';

/** Drafts and future-dated posts are visible in dev, hidden in production builds. */
const showDrafts =
  !import.meta.env.PROD ||
  // Verification only: `SHOW_DRAFTS=1 pnpm build` renders the draft content in a production build.
  // Never set it on Vercel. Read from process.env (Vite does not reliably expose non-PUBLIC vars).
  process.env.SHOW_DRAFTS === '1';

const byLocale = {
  en: {
    profile: reader.singletons.profile_en,
    home: reader.singletons.home_en,
    skills: reader.singletons.skills_en,
    projects: reader.collections.projects_en,
    posts: reader.collections.posts_en,
    testimonials: reader.collections.testimonials_en,
    experience: reader.collections.experience_en,
    education: reader.collections.education_en,
    tags: reader.collections.tags_en,
  },
} satisfies Record<Locale, unknown>;

async function required<T>(value: Promise<T | null>, what: string): Promise<T> {
  const v = await value;
  if (v === null) throw new Error(`Missing Keystatic content: ${what}`);
  return v;
}

const published = <T extends { entry: { draft?: boolean } }>(items: T[]) =>
  showDrafts ? items : items.filter((i) => !i.entry.draft);

// Singletons

export const getSettings = () =>
  required(reader.singletons.settings.read(), 'settings');

export const getProfile = (locale: Locale = 'en') =>
  required(
    byLocale[locale].profile.read({ resolveLinkedFiles: true }),
    `profile_${locale}`,
  );

export const getHome = (locale: Locale = 'en') =>
  required(byLocale[locale].home.read(), `home_${locale}`);

export const getSkills = (locale: Locale = 'en') =>
  required(byLocale[locale].skills.read(), `skills_${locale}`);

// Collections

export async function getProjects(locale: Locale = 'en') {
  const all = published(await byLocale[locale].projects.all());
  return all.sort(
    (a, b) =>
      Number(b.entry.featured) - Number(a.entry.featured) ||
      (a.entry.order ?? 0) - (b.entry.order ?? 0) ||
      (b.entry.year ?? 0) - (a.entry.year ?? 0),
  );
}

export async function getPosts(locale: Locale = 'en') {
  const today = new Date().toISOString().slice(0, 10);
  const all = published(await byLocale[locale].posts.all());
  return all
    .filter((p) => showDrafts || p.entry.publishedAt <= today)
    .sort((a, b) => b.entry.publishedAt.localeCompare(a.entry.publishedAt));
}

export async function getTestimonials(locale: Locale = 'en') {
  const all = await byLocale[locale].testimonials.all();
  return all.sort((a, b) => (a.entry.order ?? 0) - (b.entry.order ?? 0));
}

export async function getExperience(locale: Locale = 'en') {
  const all = published(await byLocale[locale].experience.all());
  // Most recent first; entries without a start date sink to the end.
  return all.sort((a, b) =>
    (b.entry.start ?? '').localeCompare(a.entry.start ?? ''),
  );
}

export async function getEducation(locale: Locale = 'en') {
  const all = published(await byLocale[locale].education.all());
  return all.sort((a, b) =>
    (b.entry.start ?? '').localeCompare(a.entry.start ?? ''),
  );
}

export const getTags = (locale: Locale = 'en') => byLocale[locale].tags.all();

/** Display names for tag slugs (unknown slugs fall back to the slug). */
export async function tagNames(
  slugs: readonly (string | null)[],
  locale: Locale = 'en',
) {
  const map = new Map(
    (await getTags(locale)).map((tag) => [tag.slug, tag.entry.label]),
  );
  return slugs.filter((s): s is string => !!s).map((s) => map.get(s) ?? s);
}

export async function getClients() {
  const all = await reader.collections.clients.all();
  return all
    .filter((c) => c.entry.visible)
    .sort((a, b) => a.entry.name.localeCompare(b.entry.name));
}

// Images (stored next to their entry, e.g. src/content/en/projects/<slug>/heroImage.png)

const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/content/**/*.{png,jpg,jpeg,webp,avif,gif,svg}',
  { eager: true },
);

/**
 * Resolve a Keystatic image value to astro:assets metadata.
 * `dir` is the entry folder relative to src/content, e.g. `en/projects/artbeat`.
 */
export function contentImage(
  dir: string,
  file: string | null | undefined,
): ImageMetadata | undefined {
  if (!file) return undefined;
  const key = `/src/content/${dir}/${file}`;
  const img = images[key]?.default;
  if (!img) throw new Error(`Image not found: ${key}`);
  return img;
}
