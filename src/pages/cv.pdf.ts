// /cv.pdf: text-based CV generated at build time from the same data as /cv (FR-7).
import type { APIRoute } from 'astro';
import { getCvData } from '@/lib/cv';
import { buildCvPdf } from '@/lib/cv-pdf';
import { buildCvModel } from '@/lib/cv-model';
import { isLive } from '@/lib/routes';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const model = await buildCvModel(await getCvData(), {
    workLive: await isLive('work'),
  });
  const pdf = await buildCvPdf(model, { siteUrl: site!.href });
  return new Response(new Uint8Array(pdf), {
    headers: { 'Content-Type': 'application/pdf' },
  });
};
