// /rss.xml (D8): hand-written RSS 2.0 with atom:link self. Items are published articles and notes only; with fewer
// posts than the gate the feed is still valid (zero items), and the footer/<head> links stay hidden (routes.rss).
import type { APIRoute } from 'astro';
import { t } from '@/i18n';
import { getSettings } from '@/lib/content';
import { getPostViews } from '@/lib/posts';
import { escapeXml as x, rfc822 } from '@/lib/xml';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const settings = await getSettings();
  const posts = (await getPostViews()).sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const abs = (path: string) => new URL(path, site).href;

  const items = posts.map((p) =>
    [
      '    <item>',
      `      <title>${x(p.title)}</title>`,
      `      <link>${x(abs(p.href))}</link>`,
      `      <guid isPermaLink="true">${x(abs(p.href))}</guid>`,
      `      <pubDate>${rfc822(p.date)}</pubDate>`,
      `      <description>${x(p.description)}</description>`,
      ...p.tags.map((tag) => `      <category>${x(tag.label)}</category>`),
      '    </item>',
    ].join('\n'),
  );

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${x(t('rss.title', { brand: settings.brand }))}</title>`,
    `    <link>${x(abs('/blog'))}</link>`,
    `    <description>${x(t('rss.description'))}</description>`,
    '    <language>en</language>',
    ...(posts[0]
      ? [`    <lastBuildDate>${rfc822(posts[0].date)}</lastBuildDate>`]
      : []),
    `    <atom:link href="${x(abs('/rss.xml'))}" rel="self" type="application/rss+xml" />`,
    ...items,
    '  </channel>',
    '</rss>',
  ];

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
