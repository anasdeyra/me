// Text-based CV PDF (pdfkit, built-in Helvetica, single column, A4) from the same CvModel as /cv.
// Helvetica uses WinAnsi, so text is sanitized to characters it can encode.
import PDFDocument from 'pdfkit';
import { t } from '@/i18n';
import type { CvModel } from './cv-model';

const MM = 72 / 25.4;
const MARGIN = 18 * MM;

// WinAnsi covers en/em dashes, curly quotes, bullets and ellipsis; map the rest to ASCII.
const replacements: Record<string, string> = {
  '→': '->',
  '‑': '-',
  ' ': ' ',
  ' ': ' ',
  '−': '-',
};
const winAnsi = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');
export function sanitize(text: string): string {
  return [...text.normalize('NFC')]
    .map((ch) => {
      if (replacements[ch]) return replacements[ch];
      const c = ch.codePointAt(0)!;
      if (c < 0x20 || (c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff))
        return c < 0x20 ? ' ' : ch;
      if (winAnsi.has(ch)) return ch;
      return (
        ch
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/[^\x20-\x7e]/g, '') || '?'
      );
    })
    .join('');
}

export type CvPdfOptions = { siteUrl: string; compress?: boolean };

export function buildCvPdf(m: CvModel, opts: CvPdfOptions): Promise<Buffer> {
  const clean = sanitize;
  const abs = (href: string) =>
    /^(https?|mailto):/.test(href) ? href : new URL(href, opts.siteUrl).href;
  const doc = new PDFDocument({
    size: 'A4',
    margin: MARGIN,
    compress: opts.compress ?? true,
    bufferPages: true,
    info: {
      Title: clean(t('cv.pdfTitle')),
      Author: clean(m.name),
      Subject: clean(t('cv.pdfSubject')),
      Keywords: clean(
        [...new Set(m.skills.flatMap((g) => g.items))].slice(0, 12).join(', '),
      ),
      Producer: new URL(opts.siteUrl).host,
      Creator: new URL(opts.siteUrl).host,
    },
  });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const body = 10;
  const small = 9;
  const regular = 'Helvetica';
  const bold = 'Helvetica-Bold';
  const ink = '#000000';
  const muted = '#444444';

  const text = (s: string, o: PDFKit.Mixins.TextOptions = {}) =>
    doc.text(clean(s), { lineGap: 2, ...o });

  const heading = (s: string) => {
    doc.moveDown(0.9);
    // Keep a heading with at least its first lines.
    if (doc.y > doc.page.height - MARGIN - 70) doc.addPage();
    doc.font(bold).fontSize(11).fillColor(ink);
    text(s.toUpperCase(), { characterSpacing: 0.6 });
    const y = doc.y + 1;
    doc
      .moveTo(MARGIN, y)
      .lineTo(doc.page.width - MARGIN, y)
      .lineWidth(0.5)
      .strokeColor(ink)
      .stroke();
    doc.moveDown(0.45).font(regular).fontSize(body);
  };

  const entry = (e: CvModel['experience'][number]) => {
    doc.font(bold).fontSize(body).fillColor(ink);
    const head = [e.title, e.org].filter(Boolean).join(', ');
    if (e.href) {
      text(head, { link: abs(e.href), underline: true });
    } else {
      text(head);
    }
    const meta = [e.range, e.meta].filter(Boolean).join(' · ');
    if (meta) {
      doc.font(regular).fontSize(small).fillColor(muted);
      text(meta);
    }
    doc.font(regular).fontSize(body).fillColor(ink);
    if (e.text) text(e.text);
    for (const b of e.bullets ?? []) {
      text(`•  ${b}`, { indent: 0, paragraphGap: 0 });
    }
    doc.moveDown(0.5);
  };

  // Header
  doc.font(bold).fontSize(20).fillColor(ink);
  text(m.heading);
  doc.font(regular).fontSize(body);
  doc.moveDown(0.3);
  if (m.openLine) text(m.openLine);
  text(m.locationLine);
  // Links on one line, each a single real link annotation (positioned by measured width).
  doc.fillColor(ink).font(regular).fontSize(body);
  const sep = '  \u00b7  ';
  const lineY = doc.y;
  let x = MARGIN;
  m.links.forEach((l, i) => {
    const label = clean(l.label);
    const w = doc.widthOfString(label);
    doc.text(label, x, lineY, {
      link: abs(l.href),
      underline: true,
      lineBreak: false,
    });
    x += w;
    if (i < m.links.length - 1) {
      doc.text(clean(sep), x, lineY, { lineBreak: false });
      x += doc.widthOfString(clean(sep));
    }
  });
  doc.x = MARGIN;
  doc.y = lineY + doc.currentLineHeight(true) + 2;

  if (m.summary) {
    heading(t('cv.summary'));
    text(m.summary);
  }
  if (m.experience.length) {
    heading(t('cv.experience'));
    m.experience.forEach(entry);
  }
  if (m.freelance) {
    heading(t('cv.freelance'));
    text(m.freelance);
  }
  if (m.skills.length) {
    heading(t('cv.skills'));
    for (const g of m.skills) {
      doc.font(bold);
      text(`${g.name}: `, { continued: true });
      doc.font(regular);
      text(g.items.join(', '));
    }
  }
  if (m.education.length) {
    heading(t('cv.education'));
    m.education.forEach(entry);
  }
  if (m.research.length) {
    heading(t('cv.research'));
    m.research.forEach(entry);
  }
  if (m.languages.length) {
    heading(t('cv.languages'));
    text(m.languages.join(', '));
  }
  if (m.projects.length) {
    heading(t('cv.projects'));
    m.projects.forEach(entry);
  }

  // Page numbers in the footer (plain text).
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.font(regular).fontSize(8).fillColor(muted);
    doc.page.margins.bottom = 0;
    doc.text(
      clean(`${m.name} · ${t('cv.pdfPage', { page: i + 1 })}`),
      MARGIN,
      doc.page.height - MARGIN + 8,
      { width: doc.page.width - 2 * MARGIN, align: 'right', lineBreak: false },
    );
  }
  doc.end();
  return done;
}
