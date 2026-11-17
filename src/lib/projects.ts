// Presentation model for projects: one typed view per Keystatic entry, so pages and components
// never touch the raw (discriminated) entry. Never synthesises facts: missing fields stay absent.
import type { ImageMetadata } from 'astro';
import { t } from '@/i18n';
import {
  contentImage,
  getClients,
  getProjects,
  getTags,
  tagNames,
} from './content';
import { countryName } from './place';

export const projectTypes = ['client', 'side', 'research'] as const;
export type ProjectType = (typeof projectTypes)[number];
export type ResearchStatus = 'ongoing' | 'submitted' | 'published';
export type ProjectLinkKind = 'live' | 'code' | 'paper' | 'slides' | 'poster';

export interface ProjectMetric {
  value: string;
  label: string;
  context?: string;
}

export interface ProjectView {
  slug: string;
  href: string;
  title: string;
  type: ProjectType;
  outcome: string;
  year?: number;
  stack: string[];
  /** Display names of the tags. */
  tags: string[];
  /** The same tags with their slugs (for links to /tag/<slug>). */
  tagRefs: { slug: string; label: string }[];
  metrics: ProjectMetric[];
  /** The first metric: the card headline when present. */
  headline?: ProjectMetric;
  /** Research only. */
  status?: ResearchStatus;
  hero?: { image: ImageMetadata; alt: string };
  gallery: { image: ImageMetadata; alt: string; caption?: string }[];
  links: { kind: ProjectLinkKind; href: string }[];
  /** Label/value rows for QuickFacts (links are rendered separately). */
  facts: { label: string; value: string }[];
  client?: {
    description?: string;
    countryCode?: string;
    country?: string;
    nda: boolean;
  };
  research?: { lab?: string; supervisor?: string };
}

type ProjectItem = Awaited<ReturnType<typeof getProjects>>[number];

const text = (v: string | null | undefined) =>
  v && v.trim() ? v.trim() : undefined;

async function projectView(
  item: ProjectItem,
  isoBySlug: Map<string, string>,
  labels: Map<string, string>,
): Promise<ProjectView> {
  const { slug, entry } = item;
  const dir = `en/projects/${slug}`;
  const type = entry.type.discriminant as ProjectType;
  const metrics = entry.metrics.map((m) => ({
    value: m.value,
    label: m.label,
    ...(text(m.context) ? { context: m.context! } : {}),
  }));

  const heroFile = contentImage(dir, entry.heroImage);
  const links: ProjectView['links'] = [];
  const addLink = (kind: ProjectLinkKind, href: string | null | undefined) => {
    if (href) links.push({ kind, href });
  };
  addLink('live', entry.links.live);
  addLink('code', entry.links.code);

  let status: ResearchStatus | undefined;
  let client: ProjectView['client'];
  let research: ProjectView['research'];
  if (entry.type.discriminant === 'client') {
    const v = entry.type.value;
    const countryCode = v.country ? isoBySlug.get(v.country) : undefined;
    client = {
      description: text(v.clientType),
      countryCode,
      country: countryCode ? countryName(countryCode) : undefined,
      nda: v.nda,
    };
  } else if (entry.type.discriminant === 'research') {
    const v = entry.type.value;
    status = v.status;
    research = { lab: text(v.lab), supervisor: text(v.supervisor) };
    addLink('paper', v.paper);
    addLink('slides', v.slides);
    addLink('poster', v.poster);
  }

  const facts: ProjectView['facts'] = [];
  const addFact = (key: Parameters<typeof t>[0], value: string | undefined) => {
    if (value) facts.push({ label: t(key), value });
  };
  addFact('work.facts.role', text(entry.role));
  addFact('work.facts.timeline', text(entry.timeline));
  addFact('work.facts.team', text(entry.team));
  addFact('work.facts.year', entry.year ? String(entry.year) : undefined);
  if (client) {
    addFact(
      'work.facts.client',
      client.nda
        ? t('work.facts.clientNda', { type: client.description ?? '' }).trim()
        : client.description,
    );
    addFact('work.facts.country', client.country);
  }
  if (research) {
    addFact('work.facts.lab', research.lab);
    addFact('work.facts.supervisor', research.supervisor);
  }

  return {
    slug,
    href: `/work/${slug}`,
    title: entry.title,
    type,
    outcome: entry.outcome,
    year: entry.year ?? undefined,
    stack: [...entry.stack],
    tags: await tagNames(entry.tags),
    tagRefs: entry.tags
      .filter((s): s is string => !!s)
      .map((s) => ({ slug: s, label: labels.get(s) ?? s })),
    metrics,
    headline: metrics[0],
    status,
    hero: heroFile
      ? { image: heroFile, alt: text(entry.heroAlt) ?? '' }
      : undefined,
    gallery: entry.gallery.map((g) => ({
      image: contentImage(dir, g.image)!,
      alt: g.alt,
      ...(text(g.caption) ? { caption: g.caption } : {}),
    })),
    links,
    facts,
    client,
    research,
  };
}

/** Every visible project (drafts per the content.ts rule) in display order. */
export async function getProjectViews(): Promise<ProjectView[]> {
  const [items, clients, tags] = await Promise.all([
    getProjects(),
    getClients(),
    getTags(),
  ]);
  const iso = new Map(clients.map((c) => [c.slug, c.entry.isoCode]));
  const labels = new Map(tags.map((t) => [t.slug, t.entry.label]));
  return Promise.all(items.map((i) => projectView(i, iso, labels)));
}

/** Home section 3: featured first (getProjects order), then the rest, up to `max`. */
export async function getFeaturedProjects(max = 4): Promise<ProjectView[]> {
  return (await getProjectViews()).slice(0, max);
}

/** Next project of the same type (wrapping), else the next one of any type; undefined when alone. */
export async function getRelated(
  slug: string,
): Promise<ProjectView | undefined> {
  const all = await getProjectViews();
  const i = all.findIndex((p) => p.slug === slug);
  if (i < 0 || all.length < 2) return undefined;
  const current = all[i];
  const rotated = [...all.slice(i + 1), ...all.slice(0, i)];
  return rotated.find((p) => p.type === current.type) ?? rotated[0];
}

/** Where "see the research" links point (D9): the research project when exactly one is published, else /work. */
export async function getResearchHref(): Promise<string | undefined> {
  const research = (await getProjectViews()).filter(
    (p) => p.type === 'research',
  );
  if (research.length === 0) return undefined;
  return research.length === 1 ? research[0].href : '/work';
}
