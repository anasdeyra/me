// The CV as plain data, built once from getCvData() and rendered by /cv (HTML) and /cv.pdf (pdfkit),
// so the two cannot diverge. Strings only: no markup, ATS-friendly (NFR-SEO-6).
import { t } from '@/i18n';
import { getClients } from './content';
import { formatRange, type CvData } from './cv';
import { countryName, utcOffset } from './place';
import { upworkBadgeLabel } from './upwork';

export type CvLink = { label: string; href: string };
export type CvEntry = {
  title: string;
  org?: string;
  meta?: string;
  range?: string;
  text?: string;
  bullets?: string[];
  href?: string;
};
export type CvModel = {
  name: string;
  title: string;
  heading: string;
  /** Header lines: open-to-roles, then location. */
  openLine: string;
  locationLine: string;
  links: CvLink[];
  summary?: string;
  experience: CvEntry[];
  freelance?: string;
  skills: { name: string; items: string[] }[];
  education: CvEntry[];
  research: CvEntry[];
  languages: string[];
  projects: CvEntry[];
};

const upper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export async function buildCvModel(
  data: CvData,
  opts: { workLive: boolean },
): Promise<CvModel> {
  const { settings: s, profile: p } = data;
  const present = t('cv.present');
  const site = new URL(import.meta.env.SITE);
  const link = (slug: string) => (opts.workLive ? `/work/${slug}` : undefined);

  const modes = upper(
    new Intl.ListFormat('en-GB', { type: 'disjunction' }).format(
      s.career.workModes.map((m) => t(`workMode.${m}` as const)),
    ),
  );
  const openLine = s.career.openToRoles
    ? [
        t('cv.open'),
        modes,
        ...(s.career.openToRelocation ? [t('cv.relocation')] : []),
      ].join(' · ')
    : '';
  const locationLine = t('cv.location', {
    city: s.location.city,
    country: countryName(s.location.countryCode),
    offset: utcOffset(s.location.timezone),
  });

  const clientCount = (await getClients()).length;
  const levelOf = (l: string) =>
    l === 'unspecified' ? '' : ` (${t(`language.level.${l}` as never)})`;
  const names = new Intl.DisplayNames(['en'], { type: 'language' });

  return {
    name: s.name,
    title: p.title,
    heading: t('cv.heading', { name: s.name, title: p.title }),
    openLine,
    locationLine,
    links: [
      { label: s.email, href: `mailto:${s.email}` },
      { label: t('contact.linkedin'), href: s.links.linkedin },
      { label: t('contact.github'), href: s.links.github },
      { label: site.host, href: site.origin },
    ],
    summary: p.cvSummary || undefined,
    experience: data.experience.map(({ entry: e }) => ({
      title: e.title,
      org: e.company,
      meta: e.location || undefined,
      range: formatRange(e.start, e.end, present) || undefined,
      bullets: [...e.bullets],
      text: e.stack.length
        ? `${t('cv.stack')}: ${e.stack.join(', ')}`
        : undefined,
    })),
    freelance: t('cv.freelanceLine', {
      badge: upworkBadgeLabel(s.upwork.badge),
      jss: s.upwork.jobSuccess,
      rating: s.upwork.rating.toFixed(1),
      reviews: s.upwork.reviews,
      clients: clientCount
        ? t('cv.freelanceClients', { count: clientCount })
        : '',
    }),
    skills: data.skills.groups
      .map((g) => ({ name: g.name, items: [...g.items] }))
      .filter((g) => g.items.length),
    education: data.education.map(({ entry: e }) => ({
      title: e.degree,
      org: e.school,
      meta: e.location || undefined,
      range: formatRange(e.start, e.end, present) || undefined,
      text: e.details || undefined,
    })),
    research: data.researchProjects.map(({ slug, entry: e }) => ({
      title: e.title,
      text: e.outcome,
      href: link(slug),
    })),
    languages: s.languages.map(
      (l) => `${upper(names.of(l.code) ?? l.code)}${levelOf(l.level)}`,
    ),
    projects: data.featuredProjects.map(({ slug, entry: e }) => ({
      title: e.title,
      text: e.outcome,
      href: link(slug),
    })),
  };
}
