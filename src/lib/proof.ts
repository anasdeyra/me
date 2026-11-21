// Testimonials and endorsement helpers. Quotes are verbatim (docs/ux-study.md 8b): never reword.
import type { ImageMetadata } from 'astro';
import { contentImage, getClients, getTestimonials } from './content';
import { countryName } from './place';
import { getProjectViews } from './projects';

export type Testimonial = Awaited<ReturnType<typeof getTestimonials>>[number];

/** The short form shown on cards and bubbles: the verbatim `excerpt` when there is one, else the quote. */
export const briefQuote = ({ entry }: Testimonial) =>
  entry.excerpt || entry.quote;

/** The author's photo, stored next to the entry (src/content/en/testimonials/<slug>/). */
export const testimonialPhoto = ({
  slug,
  entry,
}: Testimonial): ImageMetadata | undefined =>
  contentImage(`en/testimonials/${slug}`, entry.photo);

/** Up to two initials for the monogram avatar shown when there is no photo. */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

/** Featured testimonials in `order`, up to `max`. */
export async function getFeaturedTestimonials(max = 3): Promise<Testimonial[]> {
  return (await getTestimonials())
    .filter((x) => x.entry.featured)
    .slice(0, max);
}

/** The testimonial linked to a project slug (`relatedProject`), if any. */
export async function getTestimonialFor(
  slug: string,
): Promise<Testimonial | undefined> {
  return (await getTestimonials()).find((x) => x.entry.relatedProject === slug);
}

export type CaseStudy = { href: string; title: string };

/** Visible case studies by slug (drafts are hidden in production, so a review never links to a missing page). */
export async function caseStudies(): Promise<Map<string, CaseStudy>> {
  return new Map(
    (await getProjectViews()).map((p) => [p.slug, { href: p.href, title: p.title }]),
  );
}

/** The case study a review belongs to (`relatedProject`), if it is visible. */
export const caseStudyOf = (
  { entry }: Testimonial,
  cases: Map<string, CaseStudy>,
): CaseStudy | undefined => (entry.relatedProject ? cases.get(entry.relatedProject) : undefined);

/** Upwork endorsement badges with counts, from real `endorsement` values only. */
export async function endorsementTally(): Promise<
  { label: string; count: number }[]
> {
  const counts = new Map<string, number>();
  for (const { entry } of await getTestimonials()) {
    const label = entry.endorsement?.trim();
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export interface ProofPlace {
  iso: string;
  name: string;
  testimonials: Testimonial[];
}

/**
 * Testimonials grouped by the client country they are tagged with (`country`, a Keystatic relationship to a
 * visible client). `places` follow testimonial `order`, so the first place is the default selection; testimonials
 * with no (or a hidden) country are returned as `unplaced` and render as plain cards.
 */
export async function getProofPlaces(): Promise<{
  places: ProofPlace[];
  unplaced: Testimonial[];
  defaultIso: string | undefined;
}> {
  const [clients, all] = await Promise.all([getClients(), getTestimonials()]);
  const isoBySlug = new Map(clients.map((c) => [c.slug, c.entry.isoCode]));
  const byIso = new Map<string, Testimonial[]>();
  const unplaced: Testimonial[] = [];
  for (const item of all) {
    const iso = item.entry.country
      ? isoBySlug.get(item.entry.country)
      : undefined;
    if (!iso) unplaced.push(item);
    else byIso.set(iso, [...(byIso.get(iso) ?? []), item]);
  }
  const places = [...byIso].map(([iso, testimonials]) => ({
    iso,
    name: countryName(iso),
    testimonials,
  }));
  return { places, unplaced, defaultIso: places[0]?.iso };
}
