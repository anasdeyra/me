// Social cards (D9): /og/<key>.png, rendered at build time by satori + resvg (see src/lib/og.ts).
import type { APIRoute, GetStaticPaths } from 'astro';
import { getSettings } from '@/lib/content';
import { renderOg } from '@/lib/og';
import { getOgEntries, type OgEntry } from '@/lib/og-entries';

export const prerender = true;

export const getStaticPaths = (async () => {
  const entries = await getOgEntries();
  return entries.map((entry) => ({
    params: { key: entry.key },
    props: { entry },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ entry: OgEntry }> = async ({ props, site }) => {
  const settings = await getSettings();
  const png = await renderOg({
    ...props.entry,
    domain: site!.host,
    name: settings.name,
  });
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
};
