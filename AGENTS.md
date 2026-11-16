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
config/security-headers.mjs  adds HSTS/nosniff/Referrer/Permissions/COOP/XFO to .vercel/output/config.json at build
keystatic.config.ts     CMS config: composes schemas from src/keystatic (locale-suffixed keys, e.g. projects_en)
components.json         shadcn config
docs/ux-study.md        UX study (personas, stories, FR/NFR, IA, layouts, content model). Build details not decided yet
.agents/                product-marketing.md (positioning, voice, proof)
src/
  components/ui/        shadcn components (button: `buttonVariants` is shared with the Astro components)
  components/site/      static primitives: Button (cva variants, zero JS), WhatsAppButton, ThemeToggle, ThemeScript,
                        DuskGlow, WhatsAppIcon
  components/layout/    SiteHeader (sticky; Popover mobile menu), SiteFooter (closing CTA, columns, wordmark)
  components/seo/       JsonLd.astro
  content/shared/       language-neutral content (settings.yaml, clients/*.yaml)
  content/en/           translatable content: profile/, home/, skills.yaml, projects/<slug>/, posts/<slug>/,
                        testimonials/, experience/, education/, tags/ (YAML; folder per project/post, images co-located)
  i18n/                 en.ts dictionary + t() / tParts() (sentence split around {slot} links)
  keystatic/            schemas: shared.ts (settings, clients), locale.ts (per-locale factories), options.ts
  layouts/BaseLayout.astro  head/meta/OG, fonts, theme script, skip link, header, footer (`footerCta` prop)
  lib/                  utils.ts (cn), reader.ts (Keystatic reader), content.ts (typed content helpers),
                        seo.ts (canonical URLs), schema.ts (JSON-LD builders: WebSite, Person),
                        routes.ts (nav registry + FR-22 gating), contact.ts (wa.me / mailto), place.ts (Intl names, UTC offset)
  pages/index.astro     blank home (Phase 2); 404.astro; robots.txt.ts
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
- **Spec mode** (Phase 5) is a floating toggle in a bottom corner; keep that corner free of other floating UI.

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

## Planned work (not implemented)

Study (not a build plan yet): **`docs/ux-study.md`** (personas, user stories, FR/NFR, IA, page layouts, content model, analytics, content
strategy). Positioning/voice: `.agents/product-marketing.md`. Summary:

- **Audiences:** startup founders (clients) and recruiters (actively job hunting, full-stack roles), equal priority.
  Neutral, proof-first home with two doors: WhatsApp (clients) and CV (recruiters).
- **Contact:** WhatsApp is the primary CTA (context-aware prefilled `wa.me` links, QR on desktop). Secondary: email
  (copy + mailto), 3-field form (Astro Action, `prerender = false`, Resend, honeypot), LinkedIn, Upwork.
- **Proof:** Upwork Top Rated / 100% JSS / 5.0 strip, Upwork review quotes, client world map from Tunis (build-time
  dot-grid SVG, CSS-only animation), research projects; case studies added later (sections are content-gated).
- **Content types (2):** `projects` at /work/[slug] (type: client | side | research) and `posts` at /blog/[slug]
  (type: article | note). Type = chip + zero-JS filter on the index; pillars and topics are tags at /tag/[tag].
- **Pages:** home (services, process, FAQ live here only), /work, /blog, /tag/[tag], /about, /cv
  (+ text PDF, ATS-friendly), /contact, /privacy, 404 (no /legal: not a French business).
- **Signature:** Spec mode, a blueprint overlay showing spacing, type, contrast, and page weight (lazy island, `S` key,
  floating toggle in a bottom corner, not in the header).
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
  **Swiss editorial**, **black and white** (pure neutral grays for secondary text and rules; primary CTA is solid
  black, inverted in dark), **generous whitespace on large screens** (margins and section spacing grow with the
  viewport; text measure stays fixed). **No silver accent and no accent color**: color appears only as **grainy
  gradients** (gradient + film-grain noise, decorative touches). The **hero shows Anas's headshot**.
  Details: typeface **Geist** + Geist Mono (code/Spec mode only); type scale 1.333; radius 2px. Gradient palette
  **Dusk** (`#FFB238` -> `#FF4F81` -> `#7A3CFF`, with grain), used **only behind the hero portrait** for now. Hero:
  **text left (cols 1-7), portrait right (cols 9-12)**, 4:5. Photo: **color, as shot**
  (`src/content/en/profile/photo.jpg`, cropped to exclude the Gemini watermark). It is AI-generated: replace it with
  a real photo when available (same file name, or via /keystatic). Amended by the design-system entry below
  (WhatsApp green on WhatsApp CTAs; a small Dusk glow on the 404).
- 2026-11-16 design system and shell (decided with rendered previews): dark theme = black with body text #EDEDED
  (headings, rules and CTA pure white); AAA secondary grays #595959 / #A3A3A3; hairlines #E5E5E5 / #262626. Fluid type
  scale 16 -> 18px, ratio 1.2 -> 1.333 (320 -> 1440px). Width: margins 16 -> 80px, content capped at 1440px, extra width
  becomes margin. **WhatsApp CTAs use WhatsApp green #25D366 with a black label** (the one exception to "no accent").
  Header: grid-aligned (nav from column 7, full-bleed ink rule, 3px active bar), WhatsApp button labelled "WhatsApp",
  contrast-glyph theme toggle; mobile menu = full-screen Popover sheet. Footer: closing CTA "Tell me what you're
  building." (not on home), base/timezone, site + contact columns, oversized edge-to-edge wordmark. 404: numeral as
  type + small Dusk glow. Dusk grain: medium. Favicon: black tile, white Geist Bold D. Nav gating: hidden in prod until
  built and filled (Work >= 2, Writing >= 3), all shown in dev. Spec mode: floating corner toggle, not in the header.
  Fonts: local provider over `@fontsource-variable` files (the `npm` provider emits file:// URLs Astro cannot fetch).

## Do not

- Do not ship Keystatic routes to production; keep the integration dev-only.
- Do not add heavy animation libraries (framer-motion, GSAP) without a measured reason.
- Do not add a captcha; use a honeypot.
- Do not require more than 3 fields in the contact form.
- Do not hardcode UI strings or ship JS where plain Astro/CSS suffices.
- Do not commit `.env` or secrets.
