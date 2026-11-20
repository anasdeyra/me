# UX / Product Study: deyra.dev

**Status:** v4 draft, 2026-11-16 (v4: Swiss editorial in black and white, silver accent dropped for grainy-gradient color touches, headshot in the hero; v2: Tunis base, research page, silver accent, contact details, launch without case studies; v3: content flattened to 2 types, `projects` and `posts`, with type chips + tags). Source: discovery interview with Anas (9 rounds).
Positioning and voice live in `.agents/product-marketing.md`; this file is the build spec. Items marked **TBD** need input.

---

## 1. Goals and success metrics

| Goal                      | KPI (Vercel Analytics events)                                         | Target (first 3 months) |
| ------------------------- | --------------------------------------------------------------------- | ----------------------- |
| Win founder clients       | `contact_whatsapp`, `contact_form_success`, `contact_email` per visit | >= 2% of home visitors  |
| Land a full-time role     | `cv_view`, `cv_pdf_download`, `contact_linkedin`                      | Track baseline          |
| Grow reach and visibility | Organic + LinkedIn sessions to /blog (articles + notes); posts/month  | 2+ posts/month          |
| Prove "polished" claim    | Lighthouse 100 x4 on key pages (Spec mode removed 2026-11-17)          | 100 / 100 / 100 / 100   |

Funnel: **LinkedIn / Google / Upwork -> content or home -> proof (work, reviews, map) -> contact (WhatsApp) or CV**.

---

## 2. Audiences and personas

| #   | Persona                       | Arrives from                    | Wants in < 30 s                                 | Converts by                        |
| --- | ----------------------------- | ------------------------------- | ----------------------------------------------- | ---------------------------------- |
| P1  | **Startup founder** (primary) | LinkedIn post, Google, referral | "Can he build my product well? Is he reliable?" | WhatsApp, form, email              |
| P2  | **Recruiter / HR** (equal)    | LinkedIn, job application link  | Role fit, stack, work mode, CV, contact         | CV view/PDF, LinkedIn, email       |
| P3  | **Hiring engineer**           | CV link, GitHub                 | Depth, code quality, how he thinks              | Reads case studies/blog -> P2 path |
| P4  | **Content reader**            | Search, LinkedIn                | Answer to a specific question                   | Reads more -> P1 path or nothing   |
| P5  | **Upwork prospect verifying** | Upwork profile link             | Is this the same person, is the work real       | WhatsApp or back to Upwork         |

ATS note: recruiters often parse the CV with HR tools. CV and About must be machine-readable (see NFR-SEO-6).

---

## 3. User stories (with acceptance criteria)

### Founder (P1)

- **US-1** As a founder, I want to understand what Anas does and for whom in one glance, so I know I'm in the right place.
  AC: H1 + subline above the fold at 360 px width; no jargon; states outcome (polished product) + audience (startups).
- **US-2** As a founder, I want independent proof before contacting, so I trust him.
  AC: Upwork strip (Top Rated, 100% JSS, 5.0) visible in or directly under the hero; links to Upwork profile (new tab, `rel="noopener"`).
- **US-3** As a founder, I want to see similar work and its results.
  AC: 3-4 featured project cards on home, each with one headline metric; client detail page has results bar, role/timeline/stack/team, visuals, client quote, live link.
- **US-4** As a founder, I want to message him instantly.
  AC: WhatsApp CTA in header (all pages), hero, and final CTA; opens `wa.me/<number>?text=<prefilled, context-aware>`; desktop also shows a QR code on /contact.
- **US-5** As a founder who prefers not to use WhatsApp, I want another way.
  AC: email (copy-to-clipboard + mailto) and 3-field form (name, email, message) on /contact and in the home contact block.
- **US-6** As a founder, I want to know how pricing, process and communication work before talking.
  AC: home "How we work" section: 4-step process, "how quotes work" (no prices), languages (EN/FR/AR), timezone, update cadence.
- **US-7** As a founder, I want my worries answered (design? reliability? price? timezone?).
  AC: FAQ on home with >= 6 entries covering the 4 objections; native `<details>` (no JS).
- **US-8** As a founder, I want to see he works with clients like me worldwide.
  AC: client world map (section 7.4) with an accessible country list and count.

### Recruiter (P2) and hiring engineer (P3)

- **US-9** As a recruiter, I want to reach the CV in one click from the home page.
  AC: hero secondary door "Hiring? View CV" + "CV" in main nav.
- **US-10** As a recruiter, I want an ATS-friendly CV.
  AC: /cv is semantic HTML with standard headings (Summary, Experience, Skills, Education, Languages); PDF is text-based (selectable, not an image), single column, generated from the same Keystatic data.
- **US-11** As a recruiter, I want role fit, work mode and contact details immediately.
  AC: top of /cv: title "Full-stack Engineer", "Open to full-time roles", work mode "Remote, hybrid, on-site · Open to relocation", "Tunis, Tunisia (UTC+1)", email, LinkedIn, GitHub.
- **US-12** As a hiring engineer, I want evidence of depth.
  AC: case studies include an "approach" section with technical decisions; blog posts linked from CV; GitHub link.
- **US-12b** As a recruiter or hiring engineer, I want to see his research projects.
  AC: /work "Research" chip lists them (title, one-line summary, status, year, tags); each `/work/[slug]` research page has question, approach, findings, links (paper/code/slides); research is linked from /cv Education and /about.

### Reader (P4)

- **US-13** As a reader from LinkedIn, I want the article to load instantly and read well on mobile.
  AC: post LCP < 1.5 s on 4G; measure 65-75ch; ToC on long posts; code highlighted at build time (0 JS).
- **US-14** As a reader, I want more on the same topic.
  AC: tag pages (pillar tags act as topic hubs), series navigation, 3 related entries by shared tags, RSS.
- **US-15** As a reader, I want to find a past post.
  AC: Pagefind search (loaded on demand, keyboard shortcut `/`).
- **US-16** As a reader who is a founder, I want a natural path to hire.
  AC: end-of-post CTA chosen by pillar tag (founder-guides -> WhatsApp; polished-products -> project + WhatsApp).

### Owner (Anas)

- **US-17** As the owner, I want to publish a post or note in < 10 minutes of admin.
  AC: one Keystatic `posts` collection (type article/note) with drafts; OG image generated automatically; RSS/sitemap update on build.
- **US-18** As the owner, I want to know what converts.
  AC: analytics events in section 9; no cookie banner needed.
- **US-19** As the owner, I want to update client countries, testimonials and Upwork stats without code.
  AC: all in Keystatic singletons/collections.

---

## 4. Functional requirements

| ID    | Requirement                                                                                                                                                                                                                     | Priority |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-1  | Global header: name/logo, nav (Work, Writing, About, CV), theme toggle, GitHub icon link, "Let's talk" CTA to /contact (2026-11-17; WhatsApp stays in hero, final CTA, footer, menu); (Spec mode toggle removed 2026-11-17, see 7.3) | Must     |
| FR-2  | Mobile nav: disclosure menu, "Let's talk" CTA stays visible outside the menu; GitHub and WhatsApp live in the menu sheet (below sm)                                                                                             | Must     |
| FR-3  | Home page sections in order of section 6.1                                                                                                                                                                                      | Must     |
| FR-4  | Projects (`/work`): one index + one detail template for all types (client, side, research); CSS-only type chips filter the index (built as radio inputs + `:has()` on `.work-scope`, hidden when `:has()` is unsupported)       | Must     |
| FR-5  | Writing (`/blog`): one index + one detail template for articles and notes; type chips; series nav, related, reading time, ToC, one RSS                                                                                          | Must     |
| FR-6  | Tags (`/tag/[tag]`): lists projects + posts sharing a tag; pillar tags show an intro (topic hub)                                                                                                                                | Must     |
| FR-7  | /cv HTML + `/cv.pdf` (text-based) generated from the same data                                                                                                                                                                  | Must     |
| FR-8  | /about with photo, story, how I work, languages, research summary + link, human details                                                                                                                                         | Must     |
| FR-9  | /contact: WhatsApp (+ desktop QR), email copy/mailto, 3-field form (+ honeypot), LinkedIn, Upwork                                                                                                                               | Must     |
| FR-10 | Contact form: Astro Action (`prerender = false`) -> Resend; inline validation; success + error states; error state shows email fallback (built as a plain `POST /api/contact` endpoint, see AGENTS.md decisions log)            | Must     |
| FR-11 | WhatsApp links carry context-aware prefilled text (`home_hero`, `project:<slug>`, `post:<slug>`, `contact`)                                                                                                                     | Should   |
| FR-12 | ~~Spec mode overlay (section 7.3)~~ removed 2026-11-17; to be reimplemented later                                                                                                                                                                                               | Must     |
| FR-13 | Client world map (section 7.4)                                                                                                                                                                                                  | Should   |
| FR-14 | Pagefind search (lazy, `/` shortcut with off switch, dialog). Status: done (Phase 4)                                                                                                                                            | Should   |
| FR-15 | Build-time OG images per page/entry (name, title, type chip). Status: done (Phase 4)                                                                                                                                            | Must     |
| FR-16 | Theme: system default + toggle, persisted, inline head script (no flash)                                                                                                                                                        | Must     |
| FR-17 | 404 page with search + links to Work/Writing/Contact                                                                                                                                                                            | Must     |
| FR-18 | /privacy: form data, analytics, retention (GDPR applies to EU visitors; Tunisian law 2004-63). No /legal page (not a French business)                                                                                           | Must     |
| FR-22 | Content-gated sections: a home section or nav item renders only with enough published entries (Work >= 2, Writing >= 3)                                                                                                         | Must     |
| FR-19 | Copy-to-clipboard for email with live-region confirmation                                                                                                                                                                       | Should   |
| FR-20 | Drafts and scheduled `publishedAt` excluded from production build                                                                                                                                                               | Must     |

Out of scope (v1): comments, newsletter, public prices, availability badge, research as a post topic (research is a project type), FR/AR locales.

---

## 5. Non-functional requirements

The site is itself proof of "polished, fast, secure", so these are stricter than usual.

### Performance

- **NFR-P1** Lighthouse 100 in all four categories on home, a project, a post, /cv (mobile, throttled).
- **NFR-P2** Core Web Vitals: LCP < 1.5 s, CLS < 0.05, INP < 100 ms (lab, 4G).
- **NFR-P3** Budgets per page (gzip): HTML+CSS <= 60 KB; JS <= 5 KB before interaction (theme script + tiny handlers); search logic loaded only on demand (the map is CSS only).
- **NFR-P4** Images: `astro:assets`, AVIF/WebP, explicit dimensions, `loading="lazy"` except LCP image; LCP image `fetchpriority="high"`.
- **NFR-P5** Fonts: self-hosted variable Geist (already installed) + Geist Mono for code and mono micro-labels; preload one file; `font-display: swap`; subset Latin.
- **NFR-P6** No animation libraries; CSS animations only, compositor-only properties (transform, opacity).

### Accessibility (WCAG 2.2 AA minimum)

- **NFR-A1** Semantic landmarks, one H1 per page, logical heading order, skip link.
- **NFR-A2** Contrast AA (aim AAA for body text) in both themes; visible `:focus-visible` rings.
- **NFR-A3** Full keyboard access incl. search dialog, mobile menu; target size >= 24x24 px (44 px for primary CTAs).
- **NFR-A4** `prefers-reduced-motion`: map and all animations become static.
- **NFR-A5** Form: labels, `aria-describedby` errors, error summary, no placeholder-only labels.
- **NFR-A6** Decorative visuals `aria-hidden`; informative visuals (map) have a text equivalent.

### Security (a positioning claim, so it must be verifiable)

- **NFR-S1** Headers via `vercel.json`: strict CSP (no `unsafe-inline` scripts; hash for the theme script), HSTS (preload), `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `frame-ancestors 'none'`.
- **NFR-S2** Target: Mozilla Observatory A+ and securityheaders.com A+.
- **NFR-S3** Form: server-side validation, honeypot, length limits, rate limit per IP (Vercel KV or in-memory window), no secrets client-side.
- **NFR-S4** External links `rel="noopener noreferrer"`; dependency audit in CI (`pnpm audit`).

### SEO and discoverability

- **NFR-SEO-1** Unique title/description per page; canonical; OG + Twitter cards; `og:image` per page.
- **NFR-SEO-2** JSON-LD: `Person` (home/about, with `sameAs` LinkedIn/GitHub/Upwork, `knowsLanguage`), `ProfilePage` (about), `BlogPosting` (posts), `CreativeWork` (projects; `ScholarlyArticle` for research with a paper), `BreadcrumbList`, `WebSite`.
- **NFR-SEO-3** Sitemap, robots.txt, RSS (`/rss.xml`, articles + notes), `llms.txt` for AI crawlers.
- **NFR-SEO-4** Clean URLs (`/work/<slug>`, `/blog/<slug>`, no dates); pillar tag hubs internally linked (topic clusters); type filters are not URLs.
- **NFR-SEO-5** `site` = `https://deyra.dev`; trailing-slash policy fixed; 301 for any renamed slug.
- **NFR-SEO-6** ATS: /cv uses standard section names, plain text dates (`Jan 2024 – Present`), skills as text (not icons/bars), text PDF with document title + metadata.

### Privacy

- **NFR-PR1** Vercel Web Analytics (cookieless), no cookie banner. No third-party embeds that set cookies.
- **NFR-PR2** Form data used only to reply; retention stated in /privacy.

### Maintainability and content ops

- **NFR-M1** All copy in `src/i18n/en.ts` or Keystatic; no hardcoded UI strings.
- **NFR-M2** Use CSS logical properties (`ms-*`, `ps-*`, `text-start`) everywhere so FR (later) and Arabic/RTL (possible) are cheap.
- **NFR-M3** Content types validated at build (Keystatic schema + reader); build fails on missing required fields.
- **NFR-M4** Publishing workflow: write in Keystatic (dev) -> commit -> push -> Vercel build.

### Compatibility

- **NFR-C1** Last 2 versions of evergreen browsers + Safari/iOS 17+ (Popover API for the mobile menu); works without JS (except search, form enhancement; form still posts without JS).
- **NFR-C2** Layout from 320 px to 1920 px; no horizontal scroll; print stylesheet for /cv and posts.

---

## 6. Information architecture

Two content types only. Each entry has one required `type` (shown as a chip, used for filtering and layout);
topics and pillars are tags (a small managed `tags` collection, section 8).

| Collection | Route          | `type` values                               | Replaces (v2)              |
| ---------- | -------------- | ------------------------------------------- | -------------------------- |
| `projects` | `/work/[slug]` | `client` (case study) · `side` · `research` | /work, /research           |
| `posts`    | `/blog/[slug]` | `article` · `note`                          | /blog, /blog/topic, /notes |

```
/                       Home (neutral, proof-first, services/process/FAQ live here)
/work                   Projects index; type chips: All · Client · Side · Research
/work/[slug]            Project (one template, sections adapt to type)
/blog                   Writing index; type chips: All · Articles · Notes
/blog/[slug]            Post (article or note)
/tag/[tag]              Any tag across projects + posts; pillar tags get an intro (topic hubs)
/about                  About (story, how I work, photo)
/cv                     CV (HTML) + /cv.pdf
/contact                Contact (WhatsApp + QR, email, form, LinkedIn, Upwork)
/privacy                Privacy
/404                    Not found
/rss.xml  /sitemap-index.xml  /robots.txt  /llms.txt
```

Type chips filter in place with zero JS (radio inputs + `:has()`); without CSS support all entries show. Chips are not routes,
so there are no thin per-type pages to index. Tags (incl. pillars `polished-products`, `founder-guides`) are the only
taxonomy routes.

Main nav: **Work · Writing · About · CV** + [WhatsApp]. "Writing" = /blog. Work shows from launch (side + research projects count; FR-22).
Footer: closing CTA (every page; on home the same block sits in the page with the inline form), base + timezone + languages, nav, contact links, the wordmark set edge to edge,
small print (©, privacy, RSS). Links to unbuilt or under-filled
sections are hidden in production (FR-22) and shown in dev.

### 6.1 Home: section order and intent

| #   | Section           | Content                                                                                                                                                                                                                               | Serves                  |
| --- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1   | Hero              | (2026-11-17: dark full-bleed hero, giant uppercase name, portrait card, mono labels, then a "Statement" section.) H1 outcome headline, subline, **[Message me on WhatsApp]** (primary) + **[Hiring? View my CV]** (secondary), headshot                                                                                                                 | All (two doors)         |
| 2   | Trust strip       | Upwork Top Rated · 100% Job Success · 5.0 ★ (N reviews) · "Clients in 7 countries" -> links to map                                                                                                                                    | P1, P5                  |
| 3   | Selected work     | 3 featured project cards (any type; 3 in one row from lg, 2 in one row on tablet, 2 stacked on mobile): image, type chip, headline metric (or status for research), stack chips -> /work/[slug]. At launch: side + research projects until client case studies exist                                   | P1, P3                  |
| 4   | Proof (merged 4+5, 2026-11-17) | Upwork review quotes tagged by country, "Verified on Upwork" link, shown beside the client map                                                                                                                                                                  | P1                      |
| 5   | (in 4)            | Dot-grid map + country list (section 7.4); each country with a review is a control that shows it                                                                                                                                                                                   | P1 (timezone objection) |
| 6   | What I do         | 4 engagement types: MVP build · Features on existing apps · Websites & landing pages · Retainer. Each: who it's for, what you get. Design line: "Bring your designs, or I'll design it."                                              | P1                      |
| 7   | How we work       | 4 steps (WhatsApp chat or call -> Scope & quote -> Build with weekly updates -> Launch & handover/support); "How quotes work" (no prices); EN/FR/AR; UTC+1 overlap table                                                              | P1                      |
| 8   | About teaser      | Photo, 2-3 lines (engineer + research master's student in Information Systems, Tunis), links to /about and research projects; recruiter strip "Open to full-time full-stack roles: remote, hybrid, on-site, open to relocation -> CV" | P2, P1                  |
| 9   | FAQ               | Objections: design, reliability, price vs offshore, communication/timezone, ownership of code, after launch, NDA, Upwork vs direct                                                                                                    | P1                      |
| 10  | Latest writing    | 3 latest posts (articles and notes, type chip) + link to /blog                                                                                                                                                                        | P4, P3                  |
| 11  | Final CTA         | Flat two-column block: statement left; WhatsApp (primary) · email copy · short form · LinkedIn right                                                                                                                                                                               | All                     |

### 6.2 Project page (`/work/[slug]`, all types)

```
Breadcrumb  Work / <Project>
H1 project name · one-line outcome · type chip · tags
[ Results bar: 2-3 metrics, large numerals ]            client/side; research shows status + year instead
[ Hero visual (framed) ]
Quick facts aside: Role · Timeline · Stack · Team · Client type/country (client) · Lab/supervisor (research) · Links
Problem  ->  Approach (decisions, trade-offs)  ->  Result      research labels: Question -> Approach -> Findings
Gallery (2-4 framed screenshots, captions)              optional
Client quote (with Upwork verification link)            client only, if a testimonial is linked
CTA: client/side "Building something similar?" [WhatsApp, prefilled]; research "Hiring? View CV"
Next project (same type)
```

### 6.3 Post page (`/blog/[slug]`, article or note)

```
Breadcrumb  Writing / <Type>
H1 · description · date (updated date if edited) · reading time · type chip · tags
[ Cover / OG image ]                                    article only
ToC (sticky on desktop >= 1024px, collapsible on mobile; article only, auto when >= 3 H2)
Body (prose, 68ch)
Series nav (if part of series)
End CTA (by pillar tag)  ·  Share to LinkedIn (plain link, no SDK)
Related (3, shared tags, any type)
```

### 6.4 /cv (ATS-first)

```
Anas Deyra — Full-stack Engineer
Open to full-time roles · Remote, hybrid or on-site · Open to relocation · Tunis, Tunisia (UTC+1) · email · LinkedIn · GitHub · deyra.dev
[Download PDF]  [Print]
Summary (3 lines, keywords)
Experience (reverse chronological: title, company, dates, 3-4 result bullets)
Freelance: Upwork Top Rated, 100% JSS, selected clients/countries
Skills (grouped text: Languages, Frontend, Backend, Infra, Practices)
Education (incl. research program) + Research projects (links to /work/[slug])
Languages: English, French, Arabic (levels)
Selected projects (featured `projects`, links to /work/[slug])
```

### 6.5 /contact

WhatsApp card (button + QR on >= 768px, number +216 93 028 674 shown as text too) · Email (copy + mailto) · Form (name, email, message; honeypot) · LinkedIn · Upwork. Reply-time microcopy: WhatsApp "Usually replies within the hour" (confirm), email/form "within 24 hours". Form success: inline confirmation + "Prefer instant? WhatsApp". Error: message + email fallback.

---

## 7. Design direction

### 7.1 Visual language: precise and minimal

- Swiss editorial: strong type hierarchy, flush-left ragged-right text, 12-col grid with an asymmetric section split, strong full-measure rules.
- Whitespace: generous, and growing with the viewport. On large screens margins and section spacing widen; the text measure stays fixed instead of stretching.
- Hero: Anas's headshot, in color, still the human face before any claim (trust with founders and recruiters). Amended 2026-11-17: the portrait is a card overlapping a giant uppercase name on a black full-bleed hero (both themes); the original text-left/portrait-right 4:5 layout is gone.
- Type: Geist (headings, body, UI) + Geist Mono (code and the hero's mono micro-labels only), self-hosted via the Astro Fonts API. Fluid type scale (`clamp`), ratio 1.333 on desktop; radius 2px.
- **Amended 2026-11-17: Aegean blue palette** (Phase 5b builds motion and interaction on it: blue is the interaction colour, Dusk narrowed to a warm accent, see 7.1b) (ink #0D5EAF, body #1A5D8E, primary #1565C0; dark = lighter blues on navy #07111D; print stays black; later the same day text moved to deep navy #0b2545 / white in dark, with the bright blue kept as the `--link` interaction token). See AGENTS.md decisions log for current values. Original text: black and white (light: black on white; dark: white on black, body text #EDEDED), pure neutral grays for secondary text and rules. No accent color: primary CTAs are solid black (inverted in dark), except **WhatsApp CTAs, which use WhatsApp green `#25D366` with a black label** (recognition; white on that green fails AA). Otherwise color appears only as grainy gradients (7.1b).
- Motion: subtle, purposeful (map pulses, focus transitions); off under reduced motion.
- Components: shadcn (button, dialog for search), restyled with tokens. Mobile nav uses the Popover API.

### 7.1b Color touches: grainy gradients

The only color on the site: soft gradients with a film-grain noise layer, used as touches on a black-and-white page.

- **Construction:** stacked CSS gradients plus noise from an SVG `feTurbulence` filter as a `data:` URI (allowed by the CSP's `img-src 'self' data:`). No raster images, no JS.
- **Decorative only:** `aria-hidden`; never behind body text. Any text placed on a gradient must pass AA at its worst point.
- **Themes:** same hues in light and dark; grain and opacity tuned per theme.
- **Motion:** static by default; if a gradient drifts, it animates `transform`/`opacity` only and stops under `prefers-reduced-motion`.
- **`forced-colors: active`:** gradients are removed.
- **Palette: Dusk** (`#FFB238` amber -> `#FF4F81` pink -> `#7A3CFF` violet), as stacked radial gradients with grain.
- **Placement:** a soft glow behind the hero portrait, a small glow beside the 404 numeral, and (5b) the contact block / closing CTA backdrop and the map sparks. **As of 2026-11-17 only the 404, the /about portrait and the map sparks keep Dusk**; the hero and closing CTA are flat. Considered and not chosen: project image backdrops and social cards.
- **Amended 2026-11-17 (Phase 5b):** the palette is blue now (7.1) and Dusk is **amber-weighted (amber -> pink; violet unused)**, a decorative warm counterpoint; blue is the interaction colour. Never behind text.

### 7.2 Screenshot treatment (assets "don't look that good")

Uniform frame makes average screenshots look deliberate:

- Same aspect ratio (16:10), same neutral backdrop (token surface + subtle grid), minimal browser/device frame in CSS.
- Crop to the strongest UI area rather than full pages; 2x capture, consistent zoom.
- Optional "focus" annotation (callouts pointing at the polished detail).
- NDA projects: anonymized client name ("Fintech startup, Singapore") and blurred data.

### 7.3 Signature: Spec mode (REMOVED 2026-11-17, owner review; to be reimplemented later)

_Historical design, kept for the reimplementation. Nothing below exists in the code today (no toggle, `S` key, `data-spec` markup or Spec strings)._

A toggle (a floating button in a bottom corner, independent of the header, + `S` key) that overlays a blueprint layer explaining the craft of the current page. Keep that corner free of other floating UI. The `S` key must use the shared single-key module `src/scripts/shortcuts.ts` (`shortcutKey`, with the user-facing off switch) to satisfy WCAG 2.1.4.

- **Shows:** spacing between key blocks, type size/line-height/weight, contrast ratios of text vs background (computed live), tap-target sizes, landmark/heading outline, image format + size, and a page panel: HTML/CSS/JS bytes (injected at build), Lighthouse scores (from CI), security header grade.
- **Authoring:** elements opt in with `data-spec="..."` attributes in Astro markup; measurement computed client-side on toggle.
- **Implementation:** React island loaded via dynamic `import()` on first toggle (0 KB until used). Overlay is `aria-hidden`; a visually hidden live region announces "Spec mode on" and a text summary panel is keyboard reachable.
- **States:** off by default; remembered in `localStorage`; on mobile, simplified to the page panel + outline.
- **Copy hook:** "This site is a case study. Press S to inspect it."
- **Build deviations (2026-11-17):** vanilla TS lazy module in a shadow root instead of a React island (smaller first-toggle cost; overlay CSS is a linked same-origin file for the CSP); page weight comes from Resource Timing, not build-time injection; security headers are a present/missing list, not a grade; Lighthouse scores are committed JSON from `scripts/lighthouse.mjs` (lab, dated), not CI; "press S" copy is hidden for touch pointers and when shortcuts are off.

### 7.4 Client world map

"Clients in 7 countries": Singapore, Germany, France, India, Tunisia, Spain, United States. Home base: **Tunis**.

- **Rendering:** dot-grid world map generated **at build time** into inline SVG (land dots from a simplified dataset, computed in an Astro component/script). No map library ships to the browser. Target <= 15 KB gzip.
- **Markers:** dots in the foreground color at client countries with a CSS pulse (staggered `animation-delay`); Tunis marker styled distinctly ("Based here", ring + label). Thin arcs drawn from Tunis to each client country using `stroke-dashoffset`, triggered once when visible (`animation-timeline: view()`, static fallback).
- **Timezone layer (answers the objection):** caption under the map: "Based in Tunis (UTC+1, no DST): full overlap with Europe, mornings with India and Singapore, afternoons with the US East Coast."
- **Interaction:** hover/focus on a marker shows country + number of projects (optional field); markers are focusable buttons with labels; no JS beyond tooltip (CSS `:hover`/`:focus-within` is enough).
- **Accessibility:** `role="img"` + `aria-label="Clients in 7 countries: ..."` and a visible inline list of countries below the map (also good for SEO).
- **Build note (2026-11-17):** markers are not focusable; the visible country list carries the information and hover pairs list item and marker via CSS `:has()`. Pulses are capped at 2 iterations (WCAG 2.2.2).
- **Reduced motion:** static dots, no arcs animation.
- **Animation (5b, 2026-11-17):** entry is CSS scroll-linked (arcs draw, markers appear as the map crosses the viewport; no JS); blue arcs with amber sparks travelling Tunis -> client on hover (bounded, 2 passes); a pointer flashlight lights the dots under the cursor on fine pointers (label kept legible with a halo layer above it).
- **Data:** Keystatic `clients` list (country, ISO code, lat/lon, projects count, show flag).
- **Placement:** home section 5; trust strip links to it; small version on /about.

---

## 8. Content model (Keystatic)

| Type           | Kind       | Fields                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `settings`     | singleton  | siteTitle, whatsappNumber (`21693028674`), whatsappDefaultText, email, linkedinUrl, githubUrl, upworkUrl (`https://www.upwork.com/freelancers/~0141d0cac0eb05dc40`), upwork {badge: Top Rated, jss: 100, rating: 5.0, reviewsCount, jobsCount?}, replyTime {whatsapp, email}, timezone (Africa/Tunis), baseCity (Tunis)                                                                                                                                   |
| `profile`      | singleton  | name, title, headline, subline, photo, shortBio, longBio (markdoc), languages[{name, level}], workMode, location, openToRoles (bool + text)                                                                                                                                                                                                                                                                                                               |
| `home`         | singleton  | services[{title, forWho, deliverables, icon}], process[{step, title, text}], quoteProcess (text), faq[{q, a}]                                                                                                                                                                                                                                                                                                                                             |
| `projects`     | collection | **type (client/side/research)**, title, slug, outcome, year, status? (research: ongoing/submitted/published), tags[] (ref), stack[], role, timeline, team, clientType?, country?, nda?, lab/supervisor?, metrics[{label, value, context}], heroImage, gallery[{image, caption}], problem, approach, result (markdoc; labelled Question/Findings for research), links {live?, code?, paper?, slides?, poster?}, testimonial (ref)?, featured, order, draft |
| `testimonials` | collection | quote, author, role, company?, country, source (upwork/direct), sourceUrl, relatedProject (ref), featured                                                                                                                                                                                                                                                                                                                                                 |
| `clients`      | collection | country, isoCode, lat, lon, projectsCount, visible                                                                                                                                                                                                                                                                                                                                                                                                        |
| `experience`   | collection | title, company, location, start, end, bullets[], stack[]                                                                                                                                                                                                                                                                                                                                                                                                  |
| `education`    | collection | degree, school, start, end, details (research program)                                                                                                                                                                                                                                                                                                                                                                                                    |
| `skills`       | singleton  | groups[{name, items[]}]                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `posts`        | collection | **type (article/note)**, title, slug, description, tags[] (ref), series?, seriesOrder?, cover? (article), publishedAt, updatedAt?, draft, ctaVariant?, canonicalUrl?, body (markdoc)                                                                                                                                                                                                                                                                      |
| `tags`         | collection | slug, label, description? (intro on /tag/[tag]), pillar (bool: topic hub, drives end-of-post CTA)                                                                                                                                                                                                                                                                                                                                                         |

Type-specific fields use Keystatic conditional fields keyed on `type`, so the editor only shows what applies. Tags are a
referenced collection (not free text) to prevent sprawl and give hub pages an intro. A note is a post with `type: note`:
no cover, no ToC, short body.

`/cv` and `/cv.pdf` read `profile`, `experience`, `education`, `skills`, `settings`, and `projects` (research + featured).

---

## 8b. Proof inventory (Upwork)

Profile: Top Rated · 100% Job Success · 5.0 ★ · **10+ jobs** · https://www.upwork.com/freelancers/~0141d0cac0eb05dc40

**Quote policy:** text inside quotation marks is the client's own words, verifiable on Upwork. Allowed: excerpting with "…"
(meaning preserved) and typographic cleanup (".." -> "…", no space before "!"). Not allowed: rewording. Professional framing
comes from the project label, the endorsement badge, and placement. Prices and dates are not shown (the Upwork link verifies).

| #   | Project label (ours)                                     | Quote as displayed (client's words)                                                                                                                                                                                                                                                                                                                                                                                    | Endorsement          | Use                     |
| --- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ----------------------- |
| T1  | Solana NFT marketplace (React, Metaplex)                 | "Anas has a solid understanding of current development best practices. He is highly skilled with React, metaplex, and more, and has been a valuable addition to me. I would happily recommend Anas for any (Full-stack) web development project!" (home excerpt: "Anas has a solid understanding of current development best practices… I would happily recommend Anas for any (Full-stack) web development project!") | Committed to Quality | Home, featured          |
| T2  | ArtBeat, a Web3 artwork marketplace with smart contracts | "Anas is a talented full stack developer, fast in working on projects, has neat and extraordinary coding skills. Highly recommended, such a nice person."                                                                                                                                                                                                                                                              | Committed to Quality | Home, featured; /cv     |
| T3  | React product page component                             | "He pays attention to the specifications, and in a really short time… I strongly recommend him!"                                                                                                                                                                                                                                                                                                                       | Detail Oriented      | Home, featured          |
| T4  | React form app                                           | "I really think you have a superpower around front-end"                                                                                                                                                                                                                                                                                                                                                                | —                    | Pull quote (hero/about) |
| T5  | Next.js static site for QuickSeat                        | "Anas did an amazing job! Thank you so much."                                                                                                                                                                                                                                                                                                                                                                          | Committed to Quality | Secondary (/about)      |

Card anatomy: quote · project label · "Upwork client" · ★ 5.0 · endorsement chip · "Verified on Upwork" link.
Badge tally for the trust strip/about: "Committed to Quality" x3, "Detail Oriented" x1.
These projects (NFT marketplace, ArtBeat, QuickSeat) are candidates for the launch "Selected work" cards if screenshots/repos exist.

---

## 9. Analytics events (Vercel Web Analytics)

| Event                                         | Props                                                                                              |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `contact_whatsapp`                            | `location` (menu, hero, project, post, contact, final, footer, footer_cta, and page-specific ones) |
| `contact_cta`                                 | `location` (header)                                                                                |
| `contact_click`                               | `location` (project), `slug` (project page contact link)                                           |
| `contact_github`                              | `location` (header, menu)                                                                          |
| `contact_email_copy`                          | `location`                                                                                         |
| `contact_email_click`                         | `location` (incl. footer, footer_cta)                                                              |
| `contact_form_success` / `contact_form_error` | —                                                                                                  |
| `contact_linkedin`                            | `location`                                                                                         |
| `upwork_click`                                | `location`                                                                                         |
| `cv_view` / `cv_pdf_download`                 | `source`                                                                                           |
| `cv_print`                                    | — (print button on /cv)                                                                            |
| `project_link`                                | `slug`, `type` (live/code/paper/slides)                                                            |
| `filter_chip`                                 | `page` (work/blog), `type`                                                                         |
| ~~`spec_mode_toggle`~~ (removed with Spec mode) | `state`, `page`                                                                                  |
| `search_open`                                 | `trigger` (key/button)                                                                             |
| `share_click`                                 | `network` (linkedin), `slug`                                                                       |

Delegated listener on `[data-track]` attributes: one tiny inline script, no per-component JS.

---

## 10. Content strategy (reach and visibility)

**Pillars (v1, as `tags` with `pillar: true`):**

1. **Building polished products**: performance, accessibility, security, UX details in real apps (shows craft; for P1/P3).
2. **Founder guides**: decision help for founders ("How to scope an MVP", "What a good freelancer handover includes", "Questions to ask before hiring a developer", "Upwork vs direct hire: what changes for you") (captures client search intent).

Research (Information Systems): not a post pillar; each research project is a `projects` entry (`type: research`). Each new research project page gets one LinkedIn post (recruiter/engineer reach) linking to it.

**Cadence (2+/month, sustainable):** 1 article per month + 2-4 notes/TIL per month (same `posts` collection). Notes reuse daily work learnings.

**Seed backlog (12):**

| Pillar            | Title idea                                                             |
| ----------------- | ---------------------------------------------------------------------- |
| Founder guides    | How to scope an MVP you can launch in 8 weeks                          |
| Founder guides    | What a freelance developer quote should include (and red flags)        |
| Founder guides    | Design first or build first? A founder's decision guide                |
| Founder guides    | The handover checklist: what you should own when the project ends      |
| Founder guides    | Why cheap MVPs get rewritten (and how to avoid it)                     |
| Founder guides    | Working with a remote developer across timezones                       |
| Polished products | The performance budget I set on every project                          |
| Polished products | Accessibility basics that also lift conversion                         |
| Polished products | Security headers every launch should ship with                         |
| Polished products | How this portfolio scores 100 on Lighthouse  |
| Polished products | Making average screenshots look professional (case study visuals)      |
| Polished products | Forms that convert: lessons from a 3-field contact form                |

**LinkedIn distribution:** native post with the key insight + link; OG card designed for 1200x627; each post has a "LinkedIn hook" field (TBD) for reuse. Notes become short LinkedIn posts.
**Internal linking:** every post links to its pillar tag hub, 1 project, and a contextual CTA.

---

## 11. Open items (TBD)

Resolved 2026-11-16: Upwork URL + stats (10+ jobs) + 5 reviews (section 8b), WhatsApp number, country list, base (Tunis),
work mode ("Open to relocation", soft), accent (silver effect, dropped 2026-11-16 for black and white + grainy gradients), no /legal, degree (Research Master's in Information Systems),
WhatsApp reply time ("Usually replies within an hour"), contact links:
email `anasdoura607@gmail.com`, GitHub `https://github.com/anasdeyra`, LinkedIn `https://tn.linkedin.com/in/anas-deyra-7015b9240`
(canonicalize to `https://www.linkedin.com/in/anas-deyra-7015b9240` for `sameAs`).

Also resolved: T1 full text; public email `hello@deyra.dev` (Cloudflare Email Routing -> Gmail; form mail sent by Resend from
`contact@deyra.dev`, reply-to = visitor); institution: Higher Institute of Computer Science (ISI), University of Tunis El Manar.
All assets (photo, screenshots, research projects) arrive later: build with clearly marked placeholder content.

1. Confirm university name for ISI (assumed University of Tunis El Manar).
2. First 1-3 research projects to publish.
3. Photo, screenshots, OG artwork.
4. Preferred WhatsApp prefilled message (default: "Hi Anas, I found you on deyra.dev. I'd like to talk about a project: ").
5. Projects per country (optional, map tooltips).
6. Screenshots/repos for NFT marketplace, ArtBeat, QuickSeat (launch "Selected work" cards). Case studies later (FR-22).
7. Final headline: run the `copywriting` skill on the hero.

## 12. Build phases

1. **Foundation:** tokens, layout, header/footer, theme, security headers, analytics, Keystatic schemas. **Done.**
2. **Conversion core:** home (sections 1-11), /contact + form action, /cv + PDF, /about. **Done.**
3. **Proof:** testimonials, world map, projects collection + /work (side and research first, client case studies when ready). **Done.**
4. **Content engine:** posts collection + /blog, tags + /tag, series, RSS, OG images, Pagefind. **Done.**
5. **Signature:** Spec mode. Built, then removed in the 2026-11-17 owner review (to be reimplemented later).
   5b. **Motion, color and interaction** (added 2026-11-17 at Anas's request: give the portfolio more life): animated world
   map, more color, mouse interactions. CSS-first, compositor-only, reduced-motion safe, CSP-safe, within the JS budget. **Done 2026-11-17.**
6. **Audit:** accessibility, SEO, performance, web-quality-audit skills; Lighthouse 100 gate. **Done 2026-11-17** (see the decisions log in AGENTS.md; remaining owner work: `docs/launch-checklist.md`).
