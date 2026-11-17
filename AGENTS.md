# AGENTS.md

Source of truth for humans and AI agents working on this repo. Keep it short and current.

## Goal and intent

Personal portfolio for **Anas Deyra** (GitHub: `anasdeyra`), software developer. The site exists for **conversion**: get
**clients (primary)** and **recruiters (secondary)** to reach out with the least friction.

Principles:

- Clear, outcome-focused headline (what I do for whom, with what result).
- Two explicit paths from the top: **Clients** -> "Book a call" / project inquiry; **Recruiters** -> CV, stack, availability.
- Contact is reachable from every page and above the fold.
- Proof before asks: case studies as problem -> approach -> measurable result, plus testimonials.
- Answer silent objections: availability, timezone, remote, response time, engagement types.
- Fast (static, minimal JS, islands only where needed), accessible, SEO/OG/Person schema ready.

## Stack (and why)

| Piece           | Choice                                 | Why                                                             |
| --------------- | -------------------------------------- | --------------------------------------------------------------- |
| Framework       | Astro 7 (static output)                | Zero JS by default, best fit for a content site                 |
| Islands         | React 19 via `@astrojs/react`          | Only for interactive bits; shadcn/ui is React                   |
| Styling         | Tailwind CSS v4 (`@tailwindcss/vite`)  | Tokens in CSS, no config file                                   |
| Fonts           | Astro Fonts API, `local` provider      | Geist + Geist Mono from pinned `@fontsource-variable` files     |
| UI kit          | shadcn/ui (radix-nova, `@/*` alias)    | Owned, accessible components in `src/components/ui`             |
| CMS             | Keystatic, **local storage, dev only** | Git-based content, no hosted admin                              |
| Hosting         | Vercel via `@astrojs/vercel`           | Static by default; routes opt into SSR with `prerender = false` |
| Package manager | pnpm                                   |                                                                 |

## Layout

```
astro.config.mjs        Integrations, i18n, CSP, fonts, trailingSlash, sitemap, Tailwind vite plugin, dev-only Keystatic
config/work-gate.mjs     sitemap gate: disk scan of projects (same draft rule as content.ts); MIN_PROJECTS must match routes.ts
scripts/generate-land-mask.mjs  regenerates src/lib/land-mask.ts (Natural Earth 110m via world-atlas, no deps)
scripts/lighthouse.mjs  Lighthouse (mobile, `pnpm dlx lighthouse@12.8.2`) over the production build -> src/data/lighthouse.json; scripts/serve-static.mjs serves the build with real route headers and brotli/gzip like Vercel (lab sizes = production transfer sizes)
config/content-gate.mjs  FR-22 gates shared with the sitemap filter (/work, /blog)
config/search-index.mjs  Pagefind integration (index over Astro's client dir, before the adapter copy)
config/security-headers.mjs  post-build: hashes prerendered inline scripts/styles into each route's CSP, adds HSTS/nosniff/Referrer/Permissions/COOP/XFO to .vercel/output/config.json
keystatic.config.ts     CMS config: composes schemas from src/keystatic (locale-suffixed keys, e.g. projects_en)
components.json         shadcn config
docs/ux-study.md        UX study (personas, stories, FR/NFR, IA, layouts, content model, analytics events, build phases: all done)
docs/launch-checklist.md  Owner to-do before/after launch: content placeholders, Vercel setup, post-deploy verification, options
.agents/                product-marketing.md (positioning, voice, proof)
src/
  components/ui/        shadcn components (button: `buttonVariants` is shared with the Astro components)
  components/site/      static primitives: Button (cva variants, zero JS), WhatsAppButton, ThemeToggle, ThemeScript,
                        DuskGlow, WhatsAppIcon, GitHubIcon, ArrowIcon (inline SVG, currentColor), Section / SectionHeading (grid sections), ContactBlock (closing CTA),
                        ContactForm (3 fields + honeypot, one inline script), CopyEmail, QrCode (build-time SVG), Analytics,
                        Search (trigger + native dialog; lazy Pagefind chunk)
  components/home/      Hero, TrustStrip, Services, Process (incl. time-zone table), AboutTeaser, Faq (native details),
                        SelectedWork, Testimonials, ClientsWorldwide (live via the `sections.*` gates)
  components/cv/        CvEntry
  components/work/      ProjectCard, ProjectVisual (typographic fallback frame), TypeChip, ResultsBar, QuickFacts
  components/blog/      EntryRow (post or project row), PostMeta, Toc (aside + details), SeriesNav, EndCta, ShareLink, TagChips,
                        PostProgress (CSS scroll-linked reading bar, `:dir(rtl)` aware)
  components/proof/     ClientsMap (build-time dot-grid map, scroll-linked entry, pointer flashlight; + country list), TestimonialCard, Stars
  components/site/Spec*  SpecToggle (bottom-end toggle, S key, state, live region, lazy-loads the module), SpecHook (js-only "press S" sentence)
  components/layout/    SiteHeader (sticky; Popover mobile menu), SiteFooter (closing CTA, columns, wordmark)
  components/seo/       JsonLd.astro
  content/shared/       language-neutral content (settings.yaml, clients/*.yaml)
  content/en/           translatable content: profile/, home/, skills.yaml, projects/<slug>/, posts/<slug>/,
                        testimonials/, experience/, education/, tags/ (YAML; folder per project/post, images co-located)
  i18n/                 en.ts dictionary + t() / tParts() (sentence split around {slot} links); spec.ts = Spec panel and measurement strings (the lazy chunk imports only this; en.ts spreads it in)
  scripts/spec/         Spec mode lazy module (vanilla TS, shadow DOM): index (controller), measure (data-spec grammar), contrast, overlay (chips, bands), panel, page (weight, headers, Lighthouse), ui, spec.css
  data/lighthouse.json  written by scripts/lighthouse.mjs only (never by hand); shown in the Spec panel with its date
  keystatic/            schemas: shared.ts (settings, clients), locale.ts (per-locale factories), options.ts
  layouts/BaseLayout.astro  head/meta/OG, fonts, theme script, skip link, header, footer (`footerCta` prop)
  lib/                  utils.ts (cn), reader.ts (Keystatic reader), content.ts (typed content helpers),
                        seo.ts (canonical URLs), theme.ts (`THEME_COLOR`: the only literal theme-color hexes; keep equal to `--background`), schema.ts (JSON-LD builders: WebSite, Person, ProfilePage),
                        routes.ts (nav registry, section registry `isSectionLive`, FR-22 gating), contact.ts (wa.me / mailto / prefills),
                        contact-validate.ts (shared client + server), contact-server.ts (Resend, rate limit; server only),
                        cv.ts + cv-model.ts (CV data/model shared by /cv and the PDF), cv-pdf.ts (pdfkit), markdoc.ts (build-time
                        renderer), overlap.ts (time-zone table), qr.ts (uqr), upwork.ts (badge label), place.ts (Intl names, UTC offset),
                        projects.ts (typed project views, related), proof.ts (testimonials, endorsements), world-map.ts (build-time
                        map geometry), land-mask.ts (generated 2.5 degree land grid, do not edit by hand),
                        posts.ts (post views, series, related, CTA), tags.ts (tag index), entries.ts (unified post/project Entry),
                        highlight.ts (code to class tokens), og.ts + og-entries.ts (OG card renderer and entry list), xml.ts (escape, RFC-822)
  scripts/              client modules: shortcuts.ts (single-key shortcuts + off switch), search-dialog.ts (lazy Pagefind chunk),
                        pointer.ts (--mx/--my/--nx/--ny on `[data-glow]` hosts, fine pointers only, rAF, CSSOM; ~0.45 KB gz)
  pages/                index (home: hero, trust, services, process, about, FAQ), about, work/index + work/[slug], cv, cv.pdf.ts, contact, contact/sent|error,
                        blog/index + blog/[slug], tag/[tag], og/[...key].png.ts, rss.xml.ts, llms.txt.ts
                        (static 303 targets), privacy, 404, robots.txt.ts, api/contact.ts (the only on-demand route)
  styles/global.css     design tokens (shadcn names), fluid type scale, utilities (wrap, grid-page, link), .dusk
public/                 favicon.svg, favicon.ico, apple-touch-icon.png (Geist Bold "D" monogram)
.claude/skills/         project-local agent skills (see skills-lock.json)
.env.example            secrets only (contact form); everything else is Keystatic settings
```

## Commands

```
pnpm dev        # dev server (includes /keystatic admin)
pnpm build      # static build -> .vercel/output
pnpm preview
pnpm check      # astro check (TypeScript 6 required; astro check rejects TS 7)
pnpm audit      # pnpm audit --prod (no CI workflow yet: owner option, see docs/launch-checklist.md)
pnpm format     # prettier (astro + tailwind class sorting)
```

Verify with `pnpm build && pnpm check` before finishing any change.

## Conventions

- **Astro components by default.** Use a React island only for real interactivity, with the smallest directive
  (`client:visible` / `client:idle` over `client:load`).
- shadcn components live in `src/components/ui`; add with `pnpm dlx shadcn@latest add <name>`. Import via `@/`.
- Tailwind v4: design tokens (colors, fonts, radii) are CSS variables in `src/styles/global.css`; no `tailwind.config`.
- **i18n:** no hardcoded UI strings; add keys to `src/i18n/en.ts` and use `t('key', { vars })`.
- Accessibility: semantic HTML, visible focus, contrast AA, keyboard reachable, alt text, reduced-motion respected.
- Performance budget: Lighthouse >= 95 in all categories, minimal JS, optimized images (`astro:assets`), self-hosted fonts.
- SEO: unique title/description per page, canonical, OG tags, `Person` JSON-LD on the home/about page.
  `BaseLayout` props: `title` (omit on home), `description`, `image`, `type`, `noindex`, `schema` (JSON-LD nodes),
  `footerCta` (closing CTA above the footer; `false` on home).
  Mark up only visible content; no FAQPage (Google retired FAQ rich results in 2026).
- Security: CSP is enforced in production builds only (Astro hashes scripts/styles; sent as a header via the
  adapter's `staticHeaders`). It is off in `astro dev` (no hashes there; it would block Vite styles), so check CSP on
  a Vercel preview deployment.
  No `style=""` attributes, no third-party scripts/fonts/images without adding them to `security.csp` in
  `astro.config.mjs`. Shiki is off (inline styles); code highlighting must emit classes.
  `is:inline` scripts are **not** hashed by Astro: render them with `set:html` and add their hash with
  `Astro.csp?.insertScriptHash()` (pattern: `src/components/site/ThemeScript.astro`). After a build, every inline
  script/style must appear as a hash in the route's CSP in `.vercel/output/config.json`.
  Other headers live in `config/security-headers.mjs` (verify in `.vercel/output/config.json` after build).
  Because `/api/contact` is an on-demand route, the adapter drops `insertScriptHash` hashes; the post-build step in
  `config/security-headers.mjs` therefore hashes every prerendered page's inline scripts into its `script-src`.
- Sections: the home sections that wait for content (Selected work, Testimonials, Clients, Writing) are gated by the
  registry in `routes.ts` (`sections.*.built` + `isSectionLive(key)`); render a section and any link to it only when live.
- Work filter: type chips are radio inputs (`#f-all|client|side|research`, each before its label) in a `.work-filter`
  fieldset; `:has()` rules on the shared `.work-scope` ancestor hide non-matching `.work-card[data-type]`. Zero JS; the
  fieldset is hidden where `:has()` is unsupported.
- `SHOW_DRAFTS=1 pnpm build` includes draft projects in a production build; verification only, never set on Vercel.
  Finish with a plain `pnpm build`.
- Clients map geometry is build-time only (no map library; motion is CSS, pointer glow via pointer.ts). Regenerate the land mask with `scripts/generate-land-mask.mjs`.
  Per-client hover/stagger CSS is generated from the data (`m-<ISO>` classes) in an inline `<style>` hashed with
  `Astro.csp.insertStyleHash`; `config/security-headers.mjs` also adds inline style hashes to `style-src`.
- **Motion and interaction (Phase 5b).** Tokens in `global.css`: `--dur-1/2/3` (120/220/600ms), `--ease-out`, `--ease-in-out`; use them, no raw values.
  - `.reveal` (scroll-linked `view()`, finishes within 150px of entering, stagger with `[--i:0..3]`, `md:[--i:1]`): wrapper
    elements only, not on elements that also lift on hover; never on the hero, LCP candidates or forms. Off for reduced motion,
    print and Spec mode; content is never hidden without support.
  - `[data-glow]` hosts get a pointer spotlight (`.glow-tint`, Dusk parallax, map flashlight) from `src/scripts/pointer.ts`
    (fine pointers only; writes custom properties through CSSOM, never markup `style=""`). Specular effects must work without it.
  - Hover rules live inside `@media (hover: hover)` with a `:focus-visible` (or `:has(a:focus-visible)`) equivalent. Motion is
    wrapped in `prefers-reduced-motion: no-preference`; `forced-colors` guards on decorative layers. No magnetic buttons, no counters.
  - WCAG 2.2.2: no `infinite` animations. Loops are bounded and hover-initiated (map sparks/ripples 2 x 1.8 s, base-ring breathe 3 x 2.2 s);
    entries are scroll-linked (user controlled).
  - Color: blue is the interaction colour. Dusk (amber-weighted, pink) appears only on the hero portrait, 404, contact block /
    closing CTA and the map's sparks, never behind text. The theme-color hexes live in `src/lib/theme.ts`.
  - ClientsMap entry is a CSS scroll timeline (`--cm`, `view-timeline`); lightningcss drops shorthand `animation-timeline`/`animation-range`
    in some cascades, so write longhands. Spec mode turns reveals off and forces `translate: none` on hover lifts so measurements are exact.
  - Keep any map label above the flashlight layer with a background halo (`paint-order: stroke`), or it is unreadable under the pointer.
  - JS before interaction on `/` is ~4 KB gz of the 5 KB budget (inline scripts 3.1 KB, SpecToggle chunk 0.9 KB, preload helper
    1.1 KB fetched on load): about 1 KB headroom; check before adding any script.
  - CSS: `vite.build.assetsInlineLimit` is 8192 so page-specific sheets under 8 KB (ClientsMap) inline as hashed `<style>` instead of
    a render-blocking request; the shared layout sheet stays external. Verify with csp-verify after changing it.
- Analytics: a `[data-track="event"]` element with `data-track-<prop>="value"` sends a Vercel Web Analytics event via the
  delegated listener in `Analytics.astro` (production only). Add the attribute, not new scripts.

## Design system and shell

Tokens and utilities live in `src/styles/global.css`; reuse them instead of raw values.

- **Layout:** every section is `wrap grid-page` (fluid margins, content capped at 1440px, 12 columns). Spacing tokens:
  `py-section` / `pt-section` (64 -> 192px), `gap-x-gutter`, `max-w-measure` (68ch). Pages set their own top spacing;
  the footer's closing CTA brings the spacing below the page (pages with `footerCta={false}` add their own).
- **Type:** `text-xs`..`text-7xl` are the fluid scale (Tailwind's default sizes are removed); xs/sm are UI sizes,
  base 16 -> 18px, tracking and line height come with each size. Headings are `text-ink`, semibold, balanced.
- **Color:** tokens only. `text-ink` (headings, strong), `text-foreground` (body), `text-muted-foreground` (secondary),
  `border-rule` (strong rules) vs `border-border` (hairlines). WhatsApp green only through `variant="whatsapp"`
  (`<WhatsAppButton>`); Dusk only through `<DuskGlow />` in a `relative isolate` box, never behind text.
- **Buttons/links:** `<Button>` from `src/components/site` (renders `<a>` with `href`), sizes sm 40 / default 44 /
  lg 52px. Inline links use the `link` utility (always underlined). Focus is the global `:focus-visible` outline.
- **Theme:** `.dark` on `<html>`, set before paint by `ThemeScript`; toggles are `[data-theme-toggle]`. No JS = light.
- **Navigation:** routes live in `src/lib/routes.ts`. When a page ships, set `built: true`; links then appear in
  production once their content gate passes (Work >= 2 projects, Writing and RSS >= 3 posts). Dev shows everything.
- **Blog:** posts render through `renderPost` (`src/lib/markdoc.ts`): heading ids, ToC headings and reading time come from it
  (ToC only for articles with >= 3 H2). The highlighter (`highlight.ts`) emits classes only (`tk-*`) via a sentinel Shiki theme,
  never inline styles. The Keystatic post field is `cta` (`ctaVariant` on `PostView`; `auto` resolves by pillar).
  `publishedAt` compares to today in UTC (Keystatic's default "today" is the author's local day: a post saved just after
  local midnight can wait for the next UTC day).
- **OG images:** every page passes an `og` key to `BaseLayout` (`default`, a page key, `blog/<slug>`, `work/<slug>`, `tag/<tag>`);
  cards are built at build time (`og.ts`, satori + resvg, fontsource woff) and served at `/og/<key>.png`.
- **Search:** Pagefind indexes `<main>` only; mark chrome inside it (filters, meta rows, ToC, related, CTA) with `data-pagefind-ignore`.
  `noindex` pages are skipped by `config/search-index.mjs`. Pages that render `<Search />` carry `data-search-dialog`, and
  `config/security-headers.mjs` adds `'wasm-unsafe-eval'` to those routes' CSP only.
- **Single-key shortcuts** (`/` search, `S` Spec mode) must go through `src/scripts/shortcuts.ts` (`shortcutKey`, `shortcutsEnabled`,
  `setShortcutsEnabled`): ignored in fields and with modifiers, with an off switch in the search dialog (WCAG 2.1.4).
- The chip filter (zero-JS radios + `:has()`) is used on `/work` and `/blog`.
- **Spec mode** is done (Phase 5). The bottom-end corner belongs to its toggle: keep it free of other floating UI.
  - `data-spec="kind[:arg] ..."` opts an element in (space-separated; `arg` is the token name shown beside the value, e.g. `type:text-4xl spacing:py-section`).
    Kinds: `type` (size/line-height/weight/family/tracking/measure), `spacing` (block padding bands, gap to the previous block), `grid`
    (column guides), `contrast` (text vs effective background), `target[:min]` (default 24px, `target:44` for primary CTAs), `image`
    (format, bytes, intrinsic vs rendered, loading), `note` (text from `data-spec-note`, an i18n string). Landmarks and headings are automatic.
  - Magenta (`--spec`, `--spec-on`; moved from cyan on 2026-11-17 because cyan sits 1.2:1 from Aegean blue) appears only in the Spec layer.
  - The overlay CSS is a same-origin file linked inside the shadow root (`?url` import in `ui.ts`); no `<style>`, `adoptedStyleSheets`,
    `innerHTML` or markup `style=""`. Positions go through CSSOM. Overlay labels and panel text live in `src/i18n/spec.ts`.
  - "Press S" copy carries `data-key-hint`: hidden by CSS for coarse pointers and while shortcuts are off (`html[data-shortcuts-off]`, set by `shortcuts.ts`).
  - After a content change, refresh scores: `pnpm build && node scripts/lighthouse.mjs` (Phase 6 re-runs it on the final build).

## Keystatic (content)

- Config: `keystatic.config.ts`, `storage: { kind: 'local' }`. Content is files in the repo; edit in dev, then commit and push.
- The integration (`@keystatic/astro` + `@astrojs/markdoc`) is loaded **only when running `astro dev`**, so `/keystatic`
  and its API are never in the production build.
- Read content at build time through **`src/lib/content.ts`** (`getSettings()`, `getProjects('en')`, ...), which wraps the
  Keystatic reader (`src/lib/reader.ts`), hides drafts and future posts in production, sorts, and resolves co-located images
  (`contentImage(dir, file)`). This is the officially documented path for Astro; do not mix in content collections.
- The reader validates every entry against the schema, so invalid content fails the build.
- Placeholders: `[TBD]` marks a missing fact, `[Draft]` marks copy awaiting the copywriting pass. Unconfirmed projects and
  experience are `draft: true`. Grep for both before launch.
- Contact details, profile links and Upwork stats live in `src/content/shared/settings.yaml` (single source of truth);
  UI microcopy (reply times, WhatsApp prefill templates) lives in `src/i18n`.
- Edit: `pnpm dev`, open `http://localhost:4321/keystatic`.

## i18n groundwork

Astro `i18n` is configured (`defaultLocale: 'en'`, `locales: ['en']`, `prefixDefaultLocale: false`). To add a locale:
add `src/i18n/<loc>.ts`, register it in `src/i18n/index.ts`, add it to `locales`, and split Keystatic collections per locale
(e.g. `caseStudies_en`/`caseStudies_fr`, or a `locale` path segment such as `src/content/<loc>/case-studies/*`).
Pages move under `src/pages/<loc>/`.

## Product summary (all phases built)

Study: **`docs/ux-study.md`** (personas, user stories, FR/NFR, IA, page layouts, content model, analytics, content
strategy). Positioning/voice: `.agents/product-marketing.md`. What is left before launch (owner content, Vercel setup,
verification): **`docs/launch-checklist.md`**. Summary:

- **Audiences:** startup founders (clients) and recruiters (actively job hunting, full-stack roles), equal priority.
  Neutral, proof-first home with two doors: WhatsApp (clients) and CV (recruiters).
- **Contact:** WhatsApp is the primary conversation CTA in the body (context-aware prefilled `wa.me` links, QR on desktop); the
  header CTA is "Let's talk" -> /contact. Secondary: email (copy + mailto), 3-field form (plain `POST /api/contact`,
  `prerender = false`, Resend, honeypot), LinkedIn, Upwork, GitHub.
- **Proof:** Upwork Top Rated / 100% JSS / 5.0 strip, Upwork review quotes, client world map from Tunis (build-time
  dot-grid SVG, CSS scroll-linked entry and hover loops, no JS), research projects; case studies added later (sections are content-gated).
- **Content types (2):** `projects` at /work/[slug] (type: client | side | research) and `posts` at /blog/[slug]
  (type: article | note). Type = chip + zero-JS filter on the index; pillars and topics are tags at /tag/[tag].
- **Pages (all built):** home (services, process, FAQ live here only), /work, /blog, /tag/[tag], /about, /cv
  (+ text PDF, ATS-friendly), /contact, /privacy, 404 (no /legal: not a French business). Done: content engine, OG, RSS, llms.txt, search.
- **Signature:** Spec mode (built): a blueprint overlay showing spacing, type, contrast, and page weight (lazy vanilla module,
  `S` key, floating toggle in the bottom-end corner, not in the header).
- **Analytics:** Vercel Web Analytics (cookieless), events via `[data-track]`.
- **Locales:** EN at launch, FR later; use CSS logical properties so RTL stays cheap.

## Decisions log

- 2026-11: Astro + React + Tailwind v4 + shadcn + Keystatic (local, dev-only) on Vercel, pnpm.
- `astro check` needs TypeScript 6 (Astro 7 rejects TS 7 for now); `typescript` pinned to `^6`.
- Keystatic reader over content collections (documented Keystatic+Astro approach).
- 2026-11-16 discovery: domain `deyra.dev`; WhatsApp primary CTA (no Cal.com); no public prices; no availability
  badge; blog pillars = polished products + founder guides (research is a project type, not a blog pillar); 2+ posts/month incl. notes;
  base Tunis (UTC+1); visual direction precise & minimal with a metallic silver accent (superseded: see visual direction below); theme system + toggle; Spec mode is the signature feature.
- 2026-11-16: content flattened from 4 types (case studies, articles, notes, research) to 2 collections, `projects`
  and `posts`, each with a `type` field; pillar hubs, /notes and /research routes dropped in favor of chips + /tag/[tag].
- 2026-11-16 foundation: brand is **"Deyra"** (wordmark; favicon = "D" monogram). Titles: home
  "Anas Deyra | Full-stack engineer for startups", other pages "<Page> | Deyra"; og:site_name "Deyra"; Person name
  "Anas Deyra", alternateName "Deyra". Theme is light-led (founders/recruiters browse light; ~20% of web traffic is dark),
  first visit follows the OS, 2-state toggle. Header always sticky; mobile
  menu via the Popover API (browser floor: Safari/iOS 17+). Static UI = Astro components reusing shadcn cva variants;
  React only for real islands. Fonts via the Astro Fonts API (self-hosted, metric-matched fallbacks). URLs without trailing
  slash. CSP enforced from day one (Astro hashes + Vercel static headers). Keystatic: all 11 types, locale-ready paths
  (`shared/` + `<locale>/`), folder per project/post with co-located images, YAML data.
- 2026-11-16 visual direction (chosen in the design lab, now removed; restore from commit `de117ae` if needed):
  **Swiss editorial**, **black and white** (superseded 2026-11-17: Aegean blue palette; was: pure neutral grays, solid black primary CTA), **generous whitespace on large screens** (margins and section spacing grow with the
  viewport; text measure stays fixed). **No silver accent and no accent color**: color appears only as **grainy
  gradients** (gradient + film-grain noise, decorative touches). The **hero shows Anas's headshot**.
  Details: typeface **Geist** + Geist Mono (code/Spec mode only); type scale 1.333; radius 2px. Gradient palette
  **Dusk** (`#FFB238` -> `#FF4F81` -> `#7A3CFF`, with grain), used behind the hero portrait (since 5b also the 404, contact blocks and map sparks, amber-weighted; never behind text). Hero:
  **text left (cols 1-7), portrait right (cols 9-12)**, 4:5 (superseded 2026-11-17: cutout on an Aegean field, see the hero entry). Photo: **color, as shot**
  (`src/content/en/profile/photo.jpg`, cropped to exclude the Gemini watermark). It is AI-generated: replace it with
  a real photo when available (same file name, or via /keystatic; replace `cutout.png` too). Amended by the design-system entry below
  (WhatsApp green on WhatsApp CTAs; a small Dusk glow on the 404).
- 2026-11-16 design system and shell (decided with rendered previews): dark theme = black with body text #EDEDED (colors superseded 2026-11-17: blue palette, navy dark)
  (headings, rules and CTA pure white); AAA secondary grays #595959 / #A3A3A3; hairlines #E5E5E5 / #262626. Fluid type
  scale 16 -> 18px, ratio 1.2 -> 1.333 (320 -> 1440px). Width: margins 16 -> 80px, content capped at 1440px, extra width
  becomes margin. **WhatsApp CTAs use WhatsApp green #25D366 with a black label** (the one exception to "no accent").
  Header: grid-aligned (nav from column 7, full-bleed ink rule, 3px active bar), WhatsApp button labelled "WhatsApp" (replaced 2026-11-17 by GitHub icon + "Let's talk" CTA),
  contrast-glyph theme toggle; mobile menu = full-screen Popover sheet. Footer: closing CTA "Tell me what you're
  building." (not on home), base/timezone, site + contact columns, oversized edge-to-edge wordmark. 404: numeral as
  type + small Dusk glow. Dusk grain: medium. Favicon: black tile, white Geist Bold D. Nav gating: hidden in prod until
  built and filled (Work >= 2, Writing >= 3), all shown in dev. Spec mode: floating corner toggle, not in the header.
  Fonts: local provider over `@fontsource-variable` files (the `npm` provider emits file:// URLs Astro cannot fetch).

- 2026-11-17 Aegean blue palette (owner request; supersedes "black and white, no accent" and the neutral grays). Blue is the
  brand and text colour; tokens only, in `global.css`. Light (contrast on white): `--ink` #0D5EAF 6.5 (headings, wordmark,
  links, rules, focus ring), `--foreground` #1A5D8E 7.0 (body, nav), `--primary` #1565C0 (buttons, active bars; white label
  5.8), `--primary-hover` and `--link-hover` #0B5ED7 5.8, `--display` #327BC4 4.4 (**large display type only**: 404 numeral,
  footer wordmark; Tailwind `text-display`), `--muted-foreground` #4A6479 6.2 (blue-tinted slate), `--border` #D5E2EF,
  `--muted` #EEF4FA, `--input` #6F8BA6 3.6. Dark (the owner blues fail on dark, Aegean ~3:1, so lighter siblings): background
  **#07111D very dark navy** (superseded 2026-11-17 by pure black, see below; chosen over pure black after side-by-side screenshots: one blue family, the black version read
  as a blue-on-black terminal; both pass), `--ink` #8EC3F5 10.2, `--foreground` #C9DDF0 13.6, `--primary` #6CB0F0 with a
  navy label 8.2, hover #8EC3F5, `--display` #5AA0E8 6.9, `--muted-foreground` #8FA8C0 7.7, `--border` #1C3249. Every pair
  was checked with a node contrast script (all >= 4.5 for text, >= 3 for UI). Spec mode colour moved cyan -> magenta
  (`--spec` #B0136B light 6.7 | #FF7AC6 dark 8.0), distinct from blue and from Dusk/amber. OG cards use #0D5EAF ink and
  #1A5D8E secondary text. Print (CV, posts) and the CV PDF stay black on white. WhatsApp green with black label stays on
  WhatsApp CTAs only; Dusk glow unchanged then (narrowed in 5b). Favicon unchanged (open option: recolour to blue). Header = theme toggle, GitHub
  icon link (`contact_github`) and a blue "Let's talk" CTA to /contact (`contact_cta`); below sm GitHub moves into the mobile
  menu, which also holds WhatsApp (`menu` location); the header WhatsApp button is gone.
- 2026-11-16 contact form: a plain `POST /api/contact` endpoint (JSON for the form script, 303 to the static
  `/contact/sent` or `/contact/error` for no-JS) instead of an Astro Action. Actions are POST-only RPC with their own
  client runtime and redirect semantics; a plain route keeps the client script tiny, works without JS, and `/contact`
  stays fully static. Honeypot field `company_url`, in-memory rate limit counted after validation (best effort).
- 2026-11-16 `/cv.pdf`: generated at build with pdfkit and standard Helvetica (ATS-friendly text, no font embedding);
  same data model as `/cv`.
- 2026-11-16 QR code on `/contact`: `uqr` at build, inline SVG, no runtime JS.
- 2026-11-16 analytics: Vercel Web Analytics via the same-origin `/_vercel/insights/script.js` loaded by
  `Analytics.astro` (production only, hashed inline bootstrap), not the adapter's `webAnalytics` option, so the CSP
  stays explicit. Time-zone table shows standard and summer offsets (computed at build) so DST never makes it stale.
- 2026-11-17 clients map: Natural Earth 110m land rasterised to a 2.5 degree mask (committed, generated by
  `scripts/generate-land-mask.mjs`, no deps); land is one path with a `0 pitch` dasharray and round caps (dots, no
  per-dot elements); arcs are quadratic curves with varied lift. `role="img"` wrapper with a label naming the countries
  plus a visible list; markers are not focusable, hover pairs list and marker via `:has()`. The home country (Tunisia)
  is listed and counted but gets no marker or arc. Pulses stop after 2 iterations (WCAG 2.2.2).
- 2026-11-17 /work: type chips as radios + `:has()` (no JS); projects without an image get a typographic fallback
  frame; project WhatsApp prefill names the project; research projects get hiring-oriented CTA copy (View CV);
  no Review JSON-LD (not eligible for the visible Upwork quotes); detail pages emit CreativeWork + BreadcrumbList.

- 2026-11-17 Phase 4: code highlighting uses Shiki with a sentinel theme (colors map to `tk-*` classes; CSP forbids inline styles).
  OG cards: satori + @resvg/resvg-js with fontsource woff fonts, 1200x630. Pagefind runs as an Astro integration on the client
  output dir before the Vercel adapter copies it (so it lands in `.vercel/output/static/pagefind`); unused Pagefind UI files are
  removed. `'wasm-unsafe-eval'` is added per route only where the search dialog exists. Seed posts stay `draft: true`
  (verification only, `SHOW_DRAFTS=1`). The `/` shortcut stays, with an off switch (shared shortcuts module) for WCAG 2.1.4.
- 2026-11-17 Spec mode (Phase 5): a **vanilla lazy module** instead of a React island (the first toggle pays for ~8 KB gz of
  our code, not React). **Shadow DOM + a linked same-origin stylesheet** instead of constructed stylesheets or `<style>` (works
  under the enforced CSP, `style-src 'self'`, and reads as no policy bypass). **Page weight from Resource Timing** (what this
  visitor actually received, updated as more loads) instead of build-time injection. **Security headers shown as a present/missing
  list** from a same-origin HEAD, not a letter grade (a grade needs a third-party scanner). **Lighthouse JSON** is written by
  `scripts/lighthouse.mjs` (lab, mobile, local build, dated), shown only for audited paths; interim until Phase 6 re-runs it.
  Known cost: the trigger script plus Vite's preload helper (~2.1 KB gz) adds about 50 ms observed (devtools throttling) and
  ~0.3 s in Lighthouse's simulated LCP/FCP on `/` (98 vs 99).

- 2026-11-17 Phase 5b (motion, color, interaction): the map entry is **scroll-linked** (`view-timeline`, user controlled, no
  timers) and its hover effects are **bounded, hover-initiated loops** (2 passes / 3 breaths) for WCAG 2.2.2; **blue arcs and amber sparks**
  chosen after a screenshot spike; **Dusk narrowed** to amber/pink (violet dropped) on hero, 404, contact/closing CTA and map sparks;
  blue is the interaction colour. **No magnetic buttons, no number counters** (jank and a11y cost for no proof value). Reveals finish
  within 150px of entering the viewport (nothing arrives late); print is forced black. Pointer effects share one tiny module
  (`pointer.ts`) writing CSS variables. Review follow-ups: lab server compresses like Vercel (honest scores), ClientsMap sheet
  inlines (`assetsInlineLimit` 8192), theme-color hexes centralised in `src/lib/theme.ts`.
- 2026-11-17 WP6.1 (a11y + perf audit fixes): footer link grid is `relative z-10` (the decorative wordmark's inline box covered links);
  mobile menu popover gets `inert` on non-header body children while open (+ Esc/close returns focus to the Menu button, script in
  `SiteHeader.astro`); `html` has `scroll-padding-block-end: 4.75rem` for the fixed Spec toggle; reveal opacity floor 0.92 (text stays AA).
  The Spec toggle uses the sans face so Geist Mono loads only where mono text renders (home LCP 1652 -> 1502 ms, 85.7 KB). Vite's
  preload helper stays: `build.modulePreload` (false, or `resolveDependencies: () => []`) did not remove it because the helper chunk is
  also where Vite hoists the shared `shortcuts` module, so the cost is ~0.5 KB gz, not 1.2 KB; JS before interaction on pages with
  the form script stays ~4.7 KB gz. `/pagefind/*` keeps Vercel's default revalidation (unhashed entry). The unused
  `_astro/client.*.js` (React runtime, ~68 KB gz, referenced by nothing) is an owner decision: removing it means dropping `@astrojs/react`.
  `scripts/serve-static.mjs` answers `/_vercel/insights/script.js` with an empty 200 (local emulation only).
- 2026-11-17 Phase 6 (final audit, Lighthouse 100 gate): audited a11y, SEO/schema, security/best practices on plain and
  drafts builds; no high findings left in code, the remaining launch work is owner content (`docs/launch-checklist.md`).
  Decisions: `scroll-padding-block-end` 4.75rem so the Spec toggle never covers a focused element; the closed mobile menu
  is `inert` (focus returns to the Menu button on Esc); the theme toggle label uses the sans face (Geist Mono off the
  critical path); the 404 CSP is copied onto the catch-all route that serves `/404.html`
  (`config/security-headers.mjs`), so unknown URLs get the same CSP; **noindex pages carry no canonical** (404, sent/error, gated
  /work and /blog); every page graph resolves the WebSite `@id` (stub node on non-home pages); BlogPosting/CreativeWork emit
  the OG card as `image` (CreativeWork prefers its hero) and `dateModified` (posts: updated, else published); `.js-only` is
  unlayered (layered utilities would beat it) and now hides the search trigger, theme toggle and copy-email button without JS;
  the clients-map `<style>` moved to the page head (`ClientsMapStyle`, `slot="head"` on BaseLayout); contact failures
  log status/reason only (`console.error`, never PII); `pnpm-workspace.yaml` overrides clear the path-to-regexp and fflate
  advisories (one moderate `minimatch` advisory remains: CLI/dev only, a major bump across keystatic/ts-morph); CV PDF
  keywords come from the visible skills only. `scripts/serve-static.mjs` serves an empty `/_vercel/insights/script.js`
  stub (local emulation only) so local audits are free of a 404.
- 2026-11-17 hero cutout + Blueprint (owner request, layout "C" picked in a dev-only lab of four: Horizon, Duotone,
  Blueprint, Doorway; lab removed): the hero uses a transparent PNG of the portrait (`profile.cutout`,
  `src/content/en/profile/cutout.png`); `photo.jpg` stays for /about, the about teaser and the Person schema. The hero
  shows the 12 columns the site is set on (`.hero-grid`: hairline column edges with numbers, masked to 30% behind the
  copy, hidden below md) and the "Press S to inspect" line under the CTAs. The portrait stands on the trust strip's ink
  rule in cols 8-12 (no bottom padding), true colour, no field (key light added later, see the pure-black entry); the figure is 108% of its column, clipped by
  `overflow-x: clip`, so the cutout's straight shoulder edges never show. Without a cutout the hero falls back to the
  framed photo. Earlier tried and dropped: Horizon (blue block + Dusk glow), a headline runaround around the silhouette
  (a 7-word H1 is too short), a duotone/scan overlay and a paper-texture background (both reverted by the owner).

- 2026-11-17 dark theme on pure black + hero key light (owner request). Dark `--background` is **#000000** (supersedes the
  #07111D navy; `THEME_COLOR.dark` matches): text blues unchanged (foreground 15.1, ink 11.3, display 7.6, muted-foreground
  8.5, input 5.2:1 on black), surfaces re-tinted (`--muted` #0B1622, `--border` #1A2B3D), black labels on primary and Spec chips.
  The portrait is lit from its upper right (that cheek and forehead measure ~2x brighter), so the hero adds matching light:
  `.hero-key` (a soft conic beam from beyond the portrait's upper right aimed at the face, with Dusk grain in dark) behind the
  cutout and over the column lines, plus a `filter` on `.hero-figure`: light bleeding round the lit edge (up-right) and the
  cast shadow (down-left). Tokens `--key-rgb/alpha/rim/grain/shadow`: light theme = faint wash + soft ink shadow, no grain
  (reads as dirt on white); dark = visible beam + rim glow, no shadow. Physical sides on purpose (the photo is not mirrored
  in RTL). `.hero-cut` now clips both axes so the shadow never falls under the trust strip rule. Static, no JS, off in forced colours.

## Do not

- Do not ship Keystatic routes to production; keep the integration dev-only.
- Do not add heavy animation libraries (framer-motion, GSAP) without a measured reason.
- Do not add a captcha; use a honeypot.
- Do not require more than 3 fields in the contact form.
- Do not hardcode UI strings or ship JS where plain Astro/CSS suffices.
- Do not commit `.env` or secrets.
