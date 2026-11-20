// The list of social cards (D9): one per static page, project, post and tag. The key is the URL path under /og
// (`default` -> /og/default.png, `blog/<slug>` -> /og/blog/<slug>.png). Pages pass their key to BaseLayout `og`.
import { t } from '@/i18n';
import { getSettings } from './content';
import { getPostViews } from './posts';
import { getProjectViews } from './projects';
import { getTagIndex } from './tags';

export interface OgEntry {
  key: string;
  /** Mono chip, top-left. */
  chip: string;
  title: string;
  /** Soft pink glow, top-right (default card only). */
  glow?: boolean;
}

export async function getOgEntries(): Promise<OgEntry[]> {
  const [settings, posts, projects, tags] = await Promise.all([
    getSettings(),
    getPostViews(),
    getProjectViews(),
    getTagIndex(),
  ]);
  const page = (key: string, title: string): OgEntry => ({
    key,
    chip: settings.brand,
    title,
  });
  return [
    {
      key: 'default',
      chip: settings.brand,
      title: t('og.default.title'),
      glow: true,
    },
    page('about', t('about.title')),
    page('cv', t('cv.title')),
    page('contact', t('contact.title')),
    page('work', t('work.title')),
    page('blog', t('blog.title')),
    page('privacy', t('privacy.title')),
    ...projects.map((p) => ({
      key: `work/${p.slug}`,
      chip: t(`work.type.${p.type}`),
      title: p.title,
    })),
    ...posts.map((p) => ({
      key: `blog/${p.slug}`,
      chip: t(`blog.type.${p.type}`),
      title: p.title,
    })),
    ...[...tags.values()].map((tag) => ({
      key: `tag/${tag.slug}`,
      chip: t('og.chip.topic'),
      title: tag.label,
    })),
  ];
}
