// Tags model (D3): a tag page exists only for tags with at least one published post or project.
import { getTags } from './content';
import { byNewest, postEntry, projectEntry, type Entry } from './entries';
import { getPostViews } from './posts';
import { getProjectViews } from './projects';

export interface TagInfo {
  slug: string;
  label: string;
  description?: string;
  pillar: boolean;
  /** Published posts and projects, newest first. */
  entries: Entry[];
}

let index: Promise<Map<string, TagInfo>> | undefined;

/** Tags that have at least one published entry, keyed by slug. */
export function getTagIndex(): Promise<Map<string, TagInfo>> {
  return (index ??= (async () => {
    const [tags, posts, projects] = await Promise.all([
      getTags(),
      getPostViews(),
      getProjectViews(),
    ]);
    const entries = [...posts.map(postEntry), ...projects.map(projectEntry)];
    const map = new Map<string, TagInfo>();
    for (const tag of tags) {
      const mine = entries
        .filter((e) => e.tags.includes(tag.slug))
        .sort(byNewest);
      if (mine.length === 0) continue;
      map.set(tag.slug, {
        slug: tag.slug,
        label: tag.entry.label,
        description: tag.entry.description?.trim() || undefined,
        pillar: !!tag.entry.pillar,
        entries: mine,
      });
    }
    return map;
  })());
}

/** Tag chips: `href` only when the tag page exists, so a chip links exactly when its target does. */
export async function tagLinks(
  tags: readonly { slug: string; label: string }[],
): Promise<{ slug: string; label: string; href?: string }[]> {
  const idx = await getTagIndex();
  return tags.map((t) => ({
    ...t,
    ...(idx.has(t.slug) ? { href: `/tag/${t.slug}` } : {}),
  }));
}
