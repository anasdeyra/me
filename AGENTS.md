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
| UI kit          | shadcn/ui (radix-nova, `@/*` alias)    | Owned, accessible components in `src/components/ui`             |
| CMS             | Keystatic, **local storage, dev only** | Git-based content, no hosted admin                              |
| Hosting         | Vercel via `@astrojs/vercel`           | Static by default; routes opt into SSR with `prerender = false` |
| Package manager | pnpm                                   |                                                                 |

## Layout

```
astro.config.mjs        Integrations, i18n, CSP, trailingSlash, sitemap, Tailwind vite plugin, dev-only Keystatic + /lab
config/security-headers.mjs  adds HSTS/nosniff/Referrer/Permissions/COOP/XFO to .vercel/output/config.json at build
keystatic.config.ts     CMS config: composes schemas from src/keystatic (locale-suffixed keys, e.g. projects_en)
components.json         shadcn config
docs/ux-study.md        UX study (personas, stories, FR/NFR, IA, layouts, content model). Build details not decided yet
.agents/                product-marketing.md (positioning, voice, proof)
src/
  components/ui/        shadcn components (button)
  components/seo/       JsonLd.astro
  content/shared/       language-neutral content (settings.yaml, clients/*.yaml)
  content/en/           translatable content: profile/, home/, skills.yaml, projects/<slug>/, posts/<slug>/,
                        testimonials/, experience/, education/, tags/ (YAML; folder per project/post, images co-located)
  dev/lab/              design lab at /lab (dev only: fonts/direction experiments, Google Fonts, no i18n)
  i18n/                 en.ts dictionary + t() helper
  keystatic/            schemas: shared.ts (settings, clients), locale.ts (per-locale factories), options.ts
  layouts/BaseLayout.astro  head/meta/OG, global CSS
  lib/                  utils.ts (cn), reader.ts (Keystatic reader), content.ts (typed content helpers),
                        seo.ts (canonical URLs), schema.ts (JSON-LD builders: WebSite, Person)
  pages/index.astro     blank home (build not started); robots.txt.ts
  styles/global.css     Tailwind + shadcn theme tokens
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
  `BaseLayout` props: `title` (omit on home), `description`, `image`, `type`, `noindex`, `schema` (JSON-LD nodes).
  Mark up only visible content; no FAQPage (Google retired FAQ rich results in 2026).
- Security: CSP is enforced (Astro hashes scripts/styles; sent as a header via the adapter's `staticHeaders`).
  No `style=""` attributes, no third-party scripts/fonts/images without adding them to `security.csp` in
  `astro.config.mjs`. Shiki is off (inline styles); code highlighting must emit classes.
  Other headers live in `config/security-headers.mjs` (verify in `.vercel/output/config.json` after build).

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
- **Signature:** Spec mode, a blueprint overlay showing spacing, type, contrast, and page weight (lazy island, `S` key).
- **Analytics:** Vercel Web Analytics (cookieless), events via `[data-track]`.
- **Locales:** EN at launch, FR later; use CSS logical properties so RTL stays cheap.

## Decisions log

- 2026-11: Astro + React + Tailwind v4 + shadcn + Keystatic (local, dev-only) on Vercel, pnpm.
- `astro check` needs TypeScript 6 (Astro 7 rejects TS 7 for now); `typescript` pinned to `^6`.
- Keystatic reader over content collections (documented Keystatic+Astro approach).
- 2026-11-16 discovery: domain `deyra.dev`; WhatsApp primary CTA (no Cal.com); no public prices; no availability
  badge; blog pillars = polished products + founder guides (research is a project type, not a blog pillar); 2+ posts/month incl. notes;
  base Tunis (UTC+1); visual direction precise & minimal with a metallic silver accent; theme system + toggle; Spec mode is the signature feature.
- 2026-11-16: content flattened from 4 types (case studies, articles, notes, research) to 2 collections, `projects`
  and `posts`, each with a `type` field; pillar hubs, /notes and /research routes dropped in favor of chips + /tag/[tag].
- 2026-11-16 foundation: brand is **"Deyra"** (wordmark; favicon = "D" on a steel plate). Titles: home
  "Anas Deyra | Full-stack engineer for startups", other pages "<Page> | Deyra"; og:site_name "Deyra"; Person name
  "Anas Deyra", alternateName "Deyra". Theme is light-led (founders/recruiters browse light; ~20% of web traffic is dark),
  first visit follows the OS, 2-state toggle. Neutrals: cool steel (OKLCH hue ~250, low chroma). Header always sticky; mobile
  menu via the Popover API (browser floor: Safari/iOS 17+). Static UI = Astro components reusing shadcn cva variants;
  React only for real islands. Fonts via the Astro Fonts API (self-hosted, metric-matched fallbacks). URLs without trailing
  slash. CSP enforced from day one (Astro hashes + Vercel static headers). Keystatic: all 11 types, locale-ready paths
  (`shared/` + `<locale>/`), folder per project/post with co-located images, YAML data. Pending: typeface and visual
  direction (Swiss editorial vs Precision instrument), being chosen in `/lab`.

## Do not

- Do not ship Keystatic routes to production; keep the integration dev-only.
- Do not ship `/lab` to production; it is injected only in `astro dev` (`devLab` in `astro.config.mjs`).
- Do not add heavy animation libraries (framer-motion, GSAP) without a measured reason.
- Do not add a captcha; use a honeypot.
- Do not require more than 3 fields in the contact form.
- Do not hardcode UI strings or ship JS where plain Astro/CSS suffices.
- Do not commit `.env` or secrets.
