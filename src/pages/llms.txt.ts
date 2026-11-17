// /llms.txt (D8): a plain-text map of the site for language models. Facts come from profile and settings only;
// links to gated sections appear only when those sections are live in this build.
import type { APIRoute } from 'astro';
import { getProfile, getSettings } from '@/lib/content';
import { getPostViews } from '@/lib/posts';
import { getProjectViews } from '@/lib/projects';
import { isLive } from '@/lib/routes';
import { getTagIndex } from '@/lib/tags';
import { t } from '@/i18n';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const [settings, profile] = await Promise.all([getSettings(), getProfile()]);
  const abs = (path: string) => new URL(path, site).href;
  const link = (label: string, path: string, note?: string) =>
    `- [${label}](${abs(path)})${note ? `: ${note.replace(/\s+/g, ' ').trim()}` : ''}`;

  const [workLive, writingLive, rssLive] = await Promise.all([
    isLive('work'),
    isLive('writing'),
    isLive('rss'),
  ]);

  const out: string[] = [
    `# ${settings.name}`,
    '',
    `> ${profile.title} in ${settings.location.city}. ${profile.shortBio.replace(/\s+/g, ' ').trim()}`,
    '',
    '## Pages',
    link(t('nav.about'), '/about'),
    link(t('nav.cv'), '/cv'),
    link('CV (PDF)', '/cv.pdf'),
    link(
      t('nav.contact'),
      '/contact',
      `${settings.email}, WhatsApp, LinkedIn, Upwork`,
    ),
  ];

  if (workLive) {
    const projects = await getProjectViews();
    out.push('', '## Work', link(t('work.title'), '/work'));
    for (const p of projects) out.push(link(p.title, p.href, p.outcome));
  }
  if (writingLive) {
    const posts = (await getPostViews()).sort((a, b) =>
      b.date.localeCompare(a.date),
    );
    out.push('', '## Writing', link(t('blog.title'), '/blog'));
    for (const p of posts) out.push(link(p.title, p.href, p.description));
    const tags = [...(await getTagIndex()).values()];
    if (tags.length) {
      out.push('', '## Topics');
      for (const tag of tags)
        out.push(link(tag.label, `/tag/${tag.slug}`, tag.description));
    }
  }
  if (rssLive) out.push('', '## Feeds', link('RSS', '/rss.xml'));

  out.push(
    '',
    '## Elsewhere',
    `- LinkedIn: ${settings.links.linkedin}`,
    `- GitHub: ${settings.links.github}`,
    `- Upwork: ${settings.links.upwork}`,
    '',
  );
  return new Response(out.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
