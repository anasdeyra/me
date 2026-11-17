// Testimonials and endorsement helpers. Quotes are verbatim (docs/ux-study.md 8b): never reword.
import { getTestimonials } from './content';

export type Testimonial = Awaited<ReturnType<typeof getTestimonials>>[number];

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
