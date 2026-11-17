// One list-row model for posts and projects (D3), so /tag, related, /blog and the home section share EntryRow.
import type { PostType, PostView } from './posts';
import type { ProjectType, ProjectView } from './projects';

export interface Entry {
  kind: 'post' | 'project';
  slug: string;
  href: string;
  title: string;
  description: string;
  type: PostType | ProjectType;
  /** Tag slugs. */
  tags: string[];
  /** Posts: `YYYY-MM-DD`. */
  date?: string;
  /** Projects. */
  year?: number;
  /** Only set for drafts shown in dev or with SHOW_DRAFTS (posts). */
  draft?: boolean;
}

export const postEntry = (p: PostView): Entry => ({
  kind: 'post',
  slug: p.slug,
  href: p.href,
  title: p.title,
  description: p.description,
  type: p.type,
  tags: p.tags.map((t) => t.slug),
  date: p.date,
  ...(p.draft ? { draft: true } : {}),
});

export const projectEntry = (p: ProjectView): Entry => ({
  kind: 'project',
  slug: p.slug,
  href: p.href,
  title: p.title,
  description: p.outcome,
  type: p.type,
  tags: p.tagRefs.map((t) => t.slug),
  year: p.year,
});

/** Newest first: posts by date, projects by year (a project sorts as 1 January of its year). */
export const sortKey = (e: Entry) =>
  e.date ?? (e.year ? `${e.year}-01-01` : '0000-00-00');

export const byNewest = (a: Entry, b: Entry) =>
  sortKey(b).localeCompare(sortKey(a));

/** "17 November 2026" from `YYYY-MM-DD` (UTC, so the build machine's zone never shifts the day). */
export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
