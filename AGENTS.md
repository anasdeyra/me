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
scripts/lighthouse.mjs  Lighthouse (mobile, `pnpm dlx lighthouse@12.8.2`) over the production build -> src/data/lighthouse.json (audit record only, no longer shown on the site); scripts/serve-static.mjs serves the build with real route headers and brotli/gzip like Vercel (lab sizes = production transfer sizes)
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
                        DuskGlow, WhatsAppIcon, GitHubIcon, ArrowIcon (inline SVG, currentColor), Section / SectionHeading (grid sections), ContactBlock (flat two-column closing CTA; props `location`, `headingId`, `form`),
                        ContactForm (3 fields + honeypot, one inline script), CopyEmail, QrCode (build-time SVG), Analytics,
                        Search (trigger + native dialog; lazy Pagefind chunk),
                        MorphShape (decorative M3 shape that morphs, twists and changes tone with scroll; replaces the tick rings)
  components/home/      Hero (renders TrustStrip: stars + rolling Upwork claims chip; HeroShapeStyle = the portrait's spring shape morph), Statement, Services, Process + ProcessThread (the process as a scroll-linked founder/me chat), AboutTeaser (two readers: founder story + recruiter spec card),
                        Faq (native details), SelectedWork, Proof (clients map + reviews, one `#proof` section), LatestWriting
                        (the gated ones go live via the `sections.*` gates)
  components/cv/        CvEntry
  components/work/      ProjectCard, ProjectVisual (typographic fallback frame), TypeChip, ResultsBar, QuickFacts
  components/blog/      EntryRow (post or project row), PostMeta, Toc (aside + details), SeriesNav, EndCta, ShareLink, TagChips,
                        PostProgress (CSS scroll-linked reading bar, `:dir(rtl)` aware)
  components/proof/     ClientsMap (build-time land-only dot-grid map, pointer flashlight; + country list; `bare` variant under the review loop), ReviewLoop + ReviewLoopStyle (chat-bubble reviews on the map, prop `playback`: `loop` = timed, one bubble narrow, two staggered tracks wide, country chips; `scroll` = sticky pin stepped by scroll; each client arrives as an avatar with typing dots before its bubble; generated container query + keyframes in the head), ReviewScroll (loads `review-scroll.ts`, scroll mode only), Avatar, TestimonialCard
  components/layout/    SiteHeader (sticky; Popover mobile menu; desktop nav shape: anchor-positioned dot -> soft-cornered shape, zero JS), SiteFooter (closing CTA, columns, small print; no wordmark)
  components/seo/       JsonLd.astro
  content/shared/       language-neutral content (settings.yaml, clients/*.yaml)
  content/en/           translatable content: profile/, home/, skills.yaml, projects/<slug>/, posts/<slug>/,
                        testimonials/, experience/, education/, tags/ (YAML; folder per project/post, images co-located)
  i18n/                 en.ts dictionary + t() / tParts() (sentence split around {slot} links)
  data/lighthouse.json  written by scripts/lighthouse.mjs only (never by hand); not rendered anywhere since Spec mode was removed
  keystatic/            schemas: shared.ts (settings, clients), locale.ts (per-locale factories), options.ts
  layouts/BaseLayout.astro  head/meta/OG, fonts, theme script, skip link, header, footer (`footerCta` prop)
  lib/                  utils.ts (cn), reader.ts (Keystatic reader), content.ts (typed content helpers),
                        seo.ts (canonical URLs), theme.ts (`THEME_COLOR`: the only literal theme-color hexes; keep equal to `--background`), schema.ts (JSON-LD builders: WebSite, Person, ProfilePage),
                        routes.ts (nav registry, section registry `isSectionLive`, FR-22 gating), contact.ts (wa.me / mailto / prefills),
                        contact-validate.ts (shared client + server), contact-server.ts (Resend, rate limit; server only),
                        cv.ts + cv-model.ts (CV data/model shared by /cv and the PDF), cv-pdf.ts (pdfkit), markdoc.ts (build-time
                        renderer), qr.ts (uqr), upwork.ts (badge label), place.ts (Intl names, UTC offset),
                        projects.ts (typed project views, related), review-loop.ts (review loop model + generated CSS), proof.ts (testimonials, endorsements, map places: reviews grouped by `country`), world-map.ts (build-time
                        land dots + country points), m3-shapes.ts (M3 Expressive shapes as morphable clip-path polygons), spring.ts (damped spring -> CSS `linear()`; generates the spring tokens), land-mask.ts (generated 2.5 degree land grid, do not edit by hand),
                        posts.ts (post views, series, related, CTA), tags.ts (tag index), entries.ts (unified post/project Entry),
                        highlight.ts (code to class tokens), og.ts + og-entries.ts (OG card renderer and entry list), xml.ts (escape, RFC-822)
  scripts/              client modules: shortcuts.ts (the `/` search shortcut + off switch), search-dialog.ts (lazy Pagefind chunk),
                        pointer.ts (--mx/--my/--nx/--ny on `[data-glow]` hosts, fine pointers only, rAF, CSSOM; ~0.45 KB gz),
                        review-scroll.ts (scroll-mode review stepper: at most one review per 0.9 s, never moves the scroll; 0.75 KB gz)
  pages/                index (home: hero (incl. Upwork proof line), statement, work, proof, services, process, about, FAQ, writing, closing CTA), about, work/index + work/[slug], cv, cv.pdf.ts, contact, contact/sent|error,
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
- Sections: the home sections that wait for content (Selected work, Proof, Writing) are gated by the
  registry in `routes.ts` (`sections.*.built` + `isSectionLive(key)`); render a section and any link to it only when live.
- Work filter: type chips are radio inputs (`#f-all|client|side|research`, each before its label) in a `.work-filter`
  fieldset; `:has()` rules on the shared `.work-scope` ancestor hide non-matching `.work-card[data-type]`. Zero JS; the
  fieldset is hidden where `:has()` is unsupported.
- `SHOW_DRAFTS=1 pnpm build` includes draft projects in a production build; verification only, never set on Vercel.
  Finish with a plain `pnpm build`.
- Clients map geometry is build-time only (no map library; motion is CSS, pointer glow via pointer.ts). Regenerate the land mask with `scripts/generate-land-mask.mjs`.
  The map is land only (no markers, arcs or base marker since 2026-11-18). Generated CSS (ReviewLoopStyle, HeroShapeStyle, MorphShape)
  goes in inline `<style>` hashed with `Astro.csp.insertStyleHash`; `config/security-headers.mjs` also adds inline style hashes to `style-src`.
- **Motion and interaction (Phase 5b; springs since 2026-11-18).** Tokens in `global.css`, no raw values. M3 Expressive springs (CSS `linear()`
  sampled by `src/lib/spring.ts`; pair each easing with its own duration): `--ease-spring-fast`/`--dur-spring-fast` (buttons, chips, presses),
  `--ease-spring` (default spatial), `--ease-spring-slow` (large surfaces), `--ease-spring-bouncy` (shape morphs, arrow turn, card corners,
  theme glyph, pops), `--ease-effect`/`--dur-effect` (colour and opacity, never overshoots). Overshoot only on shape, rotation and scale,
  never on text position or layout. Older `--dur-1/2/3`, `--ease-out`, `--ease-in-out` remain for reveals and legacy rules.
  Buttons use the `transition-morph` utility (corners/scale on the fast spring, colour on effect; pressed corners tighten one step besides
  the 0.97 squash); the 45° arrow turn is one unlayered `[data-arrow]` rule (icons need no transition classes); `.go-chip` is the round
  arrow chip inside pills.
  - `.reveal` (scroll-linked `view()`, finishes within 150px of entering, stagger with `[--i:0..3]`, `md:[--i:1]`): wrapper
    elements only, not on elements that also move on hover; never on the hero, LCP candidates or forms. Off for reduced motion
    and print; content is never hidden without support.
  - `[data-glow]` hosts get a pointer spotlight (`.glow-tint`, Dusk parallax, map flashlight) from `src/scripts/pointer.ts`
    (fine pointers only; writes custom properties through CSSOM, never markup `style=""`). Specular effects must work without it.
  - Hover rules live inside `@media (hover: hover)` with a `:focus-visible` (or `:has(a:focus-visible)`) equivalent. Motion is
    wrapped in `prefers-reduced-motion: no-preference`; `forced-colors` guards on decorative layers. No magnetic buttons, no counters.
  - WCAG 2.2.2: no `infinite` animations. Loops are bounded and hover-initiated; entries and MorphShape are scroll-linked (user controlled,
    no pause needed). Two exceptions: the home review loop (`ReviewLoop`, `playback="loop"`) cycles reviews indefinitely, with an Auto-play switch,
    pause on focus in the country chips (not on hover over the map, owner 2026-11-20), and no rotation under reduced motion; and the hero portrait morph loops
    (owner override). `playback="scroll"` is user-driven (no pause control needed).
  - Process chat (`ProcessThread`): a sticky chat window over a tall track; each item (step chip, typing dots, message) takes a slice of
    the track's `contain` range (`[--k:n]`/`[--n:n]` literal Tailwind classes, no `style=""`) and grows from `0fr` to `1fr` in a
    bottom-aligned feed, so new messages push older ones up. Zero JS, no timers; messages are always in the DOM (folded rows are clipped,
    never hidden); without view() support, with reduced motion and in print it is a plain transcript. Spacing inside a folding row is
    margin on the content, never padding on the clipped box.
  - Color: bright blue (`--link`, also `--ring`, `--brand`, `--map-from`) is the interaction colour: links, buttons, focus.
    There is no `--rule` token: every separator is a neutral `--border` hairline, and fewer lines is the default. Text is deep navy in light (`--ink` #0b2545 headings, `--foreground` #25405e body, `--muted-foreground` #4a6176)
    and white/neutral in dark (`--ink` #fff, `--foreground` #ededed, `--muted-foreground` #a3a3a3, `--border` #262626, `--muted` #111).
    `--primary` (buttons) and `--display` (large display type only) are separate tokens. Dusk (amber-weighted, pink) appears only
    on the 404, the /about portrait and the hero portrait halo, never behind text; the closing CTA is flat. MorphShape tones are
    `--shape-violet/pink/amber` (pale in light, deep in dark; keep muted text off them in dark, ~3.1:1). Exact values and
    contrast ratios: `:root` / `.dark` in `global.css`. The theme-color hexes live in `src/lib/theme.ts`.
  - Home hero: a soft rounded `bg-muted` panel that follows the theme: the morphing portrait (HeroShapeStyle: each shape-to-shape morph and
    turn rides one spring with overshoot and a small breath; shapes are drawn inset with a negative margin so overshoot is not clipped;
    photo overscan is computed over the spring's full range), a MorphShape behind it, name and title, the outcome H1, subline,
    TrustStrip, pill doors (WhatsApp, CV) with hints. Then `Statement` (centred uppercase line, "More about me" pill, two MorphShapes at
    the edges). No `.reveal` and no JS on the hero. The hero is being redone from scratch (owner review 2026-11-20).
  - Scroll-driven animations: lightningcss drops shorthand `animation-timeline`/`animation-range` in some cascades, so write longhands.
  - Keep any map label above the flashlight layer with a background halo (`paint-order: stroke`), or it is unreadable under the pointer.
  - JS before interaction on `/`: re-measure (last measured ~4 KB gz of the 5 KB budget, which included the now-removed SpecToggle
    chunk of 0.9 KB, so there should be more headroom). Check before adding any script.
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
  `border-border` for every separator (hairlines only; no coloured rules, use space before adding a line). WhatsApp green only through `variant="whatsapp"`
  (`<WhatsAppButton>`); Dusk only through `<DuskGlow />` in a `relative isolate` box (404, /about portrait), never behind text.
- **Buttons/links:** `<Button>` from `src/components/site` (renders `<a>` with `href`), sizes sm 40 / default 44 /
  lg 52px. Inline links use the `link` utility (always underlined). Focus is the global `:focus-visible` outline.
  Interaction is morph and turn, never lift or shadow: hover/focus morph the pill (radius = half the height, set per size
  in `buttonVariants`; never override with `rounded-full` or the morph snaps) to a soft rounded rectangle, a press
  squashes to 0.97, and any `ArrowIcon` (`data-arrow`) inside a hovered/focused link or button turns 45 degrees (global
  rule in `global.css`). All motion-safe; reduced motion keeps colour changes only.
- **Theme:** `.dark` on `<html>`, set before paint by `ThemeScript`; toggles are `[data-theme-toggle]`. No JS = light.
- **Header nav (variant C "Morph", 2026-11-20):** one anchor-positioned `.site-shape` in the header row (global `<style>` in
  SiteHeader). At rest a 6px dot under the current tab (current tab also ink + medium weight); hovering or keyboard-focusing a
  `.site-target` (tabs, theme toggle, GitHub) moves the anchor there and the dot grows into a radius-md shape (travel on
  `--ease-spring`, growth and corners on `--ease-spring-bouncy`, press 0.94 + radius-sm on the fast spring, a 160ms wait before going
  home, keyboard focus beats a resting pointer). White with `mix-blend-mode: difference`, so it reads black on light / white on dark
  and inverts the label under it: keep the header background solid and opaque. Home (no current tab): hidden at rest, grows from the
  row centre. Desktop only (>= 64rem); tabs padded 12px (16px from xl) so the bar fits its grid at 1024px. Fallbacks: no anchor
  positioning = each tab fills in place + dot; forced colours = underline; reduced motion = jump. The mobile sheet marks the current
  page with a round dot.
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
- **Single-key shortcuts** (`/` search) must go through `src/scripts/shortcuts.ts` (`shortcutKey`, `shortcutsEnabled`,
  `setShortcutsEnabled`): ignored in fields and with modifiers, with an off switch in the search dialog (WCAG 2.1.4).
- The chip filter (zero-JS radios + `:has()`) is used on `/work` and `/blog`, and for the home review loop's country chips.
- **Closing CTA:** `ContactBlock` is a flat two-column block (statement left, contact paths right), no gradient. Props: `location`
  (`final` | `footer_cta`, the analytics location), `headingId`, `form` (inline 3-field form instead of the "Project inquiry" link; one
  per page). `SiteFooter` renders it as `footer_cta` on every page that keeps `footerCta`; the home page renders it as `final` with `form`.
- **Spec mode was removed** (owner review 2026-11-17; to be reimplemented later). Nothing in the code references it: no `data-spec`
  attributes, `S` shortcut, spec i18n strings, `--spec` tokens or bottom-end toggle. Do not add `data-spec` markup until it returns.
  The bottom-end corner is free again. Lighthouse scores are no longer shown on the site: after a content change, refresh the record with
  `pnpm build && node scripts/lighthouse.mjs` (`src/data/lighthouse.json`).

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
- **Proof:** Upwork proof line in the hero (5 stars + a chip rolling Top Rated / 100% JSS / reviews / countries); one home `#proof` section joining the client world map from Tunis (build-time
  dot-grid SVG, CSS scroll-linked entry and hover loops) with the Upwork review quotes popping from their country as a looping chat
  bubble (country radios + `:has()`, zero JS; each review is tagged with a client `country` in Keystatic, untagged reviews follow as
  plain cards); research projects; case studies
  added later (sections are content-gated).
- **Content types (2):** `projects` at /work/[slug] (type: client | side | research) and `posts` at /blog/[slug]
  (type: article | note). Type = chip + zero-JS filter on the index; pillars and topics are tags at /tag/[tag].
- **How we work:** the home process is a chat between a founder and me (Keystatic `home.process[].messages`, one chip per step);
  the time-zone objection is one line beside it (Tunis, UTC+1, overlap with European hours) plus the FAQ; no time-zone table.
- **Pages (all built):** home (services, process, FAQ live here only), /work, /blog, /tag/[tag], /about, /cv
  (+ text PDF, ATS-friendly), /contact, /privacy, 404 (no /legal: not a French business). Done: content engine, OG, RSS, llms.txt, search.
- **Signature:** none at the moment. Spec mode (blueprint overlay) was removed in the 2026-11-17 owner review and is to be
  reimplemented later (see the decisions log).
- **Analytics:** Vercel Web Analytics (cookieless), events via `[data-track]`.
- **Locales:** EN at launch, FR later; use CSS logical properties so RTL stays cheap.

## Decisions log

- 2026-11: Astro + React + Tailwind v4 + shadcn + Keystatic (local, dev-only) on Vercel, pnpm.
- `astro check` needs TypeScript 6 (Astro 7 rejects TS 7 for now); `typescript` pinned to `^6`.
- Keystatic reader over content collections (documented Keystatic+Astro approach).
- 2026-11-16 discovery: domain `deyra.dev`; WhatsApp primary CTA (no Cal.com); no public prices; no availability
  badge; blog pillars = polished products + founder guides (research is a project type, not a blog pillar); 2+ posts/month incl. notes;
  base Tunis (UTC+1); visual direction precise & minimal with a metallic silver accent (superseded: see visual direction below); theme system + toggle; Spec mode was the signature feature (removed 2026-11-17).
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
  Details: typeface **Geist** + Geist Mono (code and the hero's mono micro-labels only); type scale 1.333; radius 2px. Gradient palette
  **Dusk** (`#FFB238` -> `#FF4F81` -> `#7A3CFF`, with grain), used behind the hero portrait (since 5b also the 404, contact blocks and map sparks, amber-weighted; never behind text; since the 2026-11-17 hero/CTA entries only the 404, /about portrait and map sparks). Hero:
  **text left (cols 1-7), portrait right (cols 9-12)**, 4:5 (superseded 2026-11-17: see the dark hero entry). Photo: **color, as shot**
  (`src/content/en/profile/photo.jpg`, cropped to exclude the Gemini watermark). It is AI-generated: replace it with
  a real photo when available (same file name, or via /keystatic; replace `cutout.png` too). Amended by the design-system entry below
  (WhatsApp green on WhatsApp CTAs; a small Dusk glow on the 404).
- 2026-11-16 design system and shell (decided with rendered previews): dark theme = black with body text #EDEDED (colors superseded 2026-11-17: blue palette, navy dark)
  (headings, rules and CTA pure white); AAA secondary grays #595959 / #A3A3A3; hairlines #E5E5E5 / #262626. Fluid type
  scale 16 -> 18px, ratio 1.2 -> 1.333 (320 -> 1440px). Width: margins 16 -> 80px, content capped at 1440px, extra width
  becomes margin. **WhatsApp CTAs use WhatsApp green #25D366 with a black label** (the one exception to "no accent").
  Header: grid-aligned (nav from column 7, full-bleed ink rule, 3px active bar (superseded 2026-11-20: header nav morph)), WhatsApp button labelled "WhatsApp" (replaced 2026-11-17 by GitHub icon + "Let's talk" CTA),
  contrast-glyph theme toggle; mobile menu = full-screen Popover sheet. Footer: closing CTA "Tell me what you're
  building." (not on home), base/timezone, site + contact columns, oversized edge-to-edge wordmark. 404: numeral as
  type + small Dusk glow. Dusk grain: medium. Favicon: black tile, white Geist Bold D. Nav gating: hidden in prod until
  built and filled (Work >= 2, Writing >= 3), all shown in dev.
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
  was checked with a node contrast script (all >= 4.5 for text, >= 3 for UI). (Superseded: the light ink/foreground and the dark
  palette changed again the same day, see the "text colours" entry below; Spec mode, and its magenta, are gone.) OG cards use #0D5EAF ink and
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
- 2026-11-17 Spec mode (Phase 5; REMOVED later that day, see the removal entry below): a **vanilla lazy module** instead of a React island (the first toggle pays for ~8 KB gz of
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
  `SiteHeader.astro`); `html` has `scroll-padding-block-end: 4.75rem` for the fixed Spec toggle (removed with Spec mode); reveal opacity floor 0.92 (text stays AA).
  The Spec toggle uses the sans face so Geist Mono loads only where mono text renders (home LCP 1652 -> 1502 ms, 85.7 KB). Vite's
  preload helper stays: `build.modulePreload` (false, or `resolveDependencies: () => []`) did not remove it because the helper chunk is
  also where Vite hoists the shared `shortcuts` module, so the cost is ~0.5 KB gz, not 1.2 KB; JS before interaction on pages with
  the form script stays ~4.7 KB gz. `/pagefind/*` keeps Vercel's default revalidation (unhashed entry). The unused
  `_astro/client.*.js` (React runtime, ~68 KB gz, referenced by nothing) is an owner decision: removing it means dropping `@astrojs/react`.
  `scripts/serve-static.mjs` answers `/_vercel/insights/script.js` with an empty 200 (local emulation only).
- 2026-11-17 Phase 6 (final audit, Lighthouse 100 gate): audited a11y, SEO/schema, security/best practices on plain and
  drafts builds; no high findings left in code, the remaining launch work is owner content (`docs/launch-checklist.md`).
  Decisions: `scroll-padding-block-end` 4.75rem so the Spec toggle never covers a focused element (since removed); the closed mobile menu
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
- 2026-11-17 hero cutout + Blueprint (SUPERSEDED the same day by the dark hero entry below: `.hero-grid`, `.hero-key`, the cutout and "Press S" are gone; owner request, layout "C" picked in a dev-only lab of four: Horizon, Duotone,
  Blueprint, Doorway; lab removed): the hero uses a transparent PNG of the portrait (`profile.cutout`,
  `src/content/en/profile/cutout.png`, now unused); `photo.jpg` stays for /about, the about teaser and the Person schema. The hero
  shows the 12 columns the site is set on (`.hero-grid`: hairline column edges with numbers, masked to 30% behind the
  copy, hidden below md) and the "Press S to inspect" line under the CTAs. The portrait stands on the trust strip's ink
  rule in cols 8-12 (no bottom padding), true colour, no field (key light added later, see the pure-black entry); the figure is 108% of its column, clipped by
  `overflow-x: clip`, so the cutout's straight shoulder edges never show. Without a cutout the hero falls back to the
  framed photo. Earlier tried and dropped: Horizon (blue block + Dusk glow), a headline runaround around the silhouette
  (a 7-word H1 is too short), a duotone/scan overlay and a paper-texture background (both reverted by the owner).

- 2026-11-17 dark theme on pure black + hero key light (owner request; the key light is SUPERSEDED, the black background and its token notes were revised by the "text colours" entry below). Dark `--background` is **#000000** (supersedes the
  #07111D navy; `THEME_COLOR.dark` matches): text blues unchanged (foreground 15.1, ink 11.3, display 7.6, muted-foreground
  8.5, input 5.2:1 on black), surfaces re-tinted (`--muted` #0B1622, `--border` #1A2B3D), black labels on primary.
  The portrait is lit from its upper right (that cheek and forehead measure ~2x brighter), so the hero adds matching light:
  `.hero-key` (a soft conic beam from beyond the portrait's upper right aimed at the face, with Dusk grain in dark) behind the
  cutout and over the column lines, plus a `filter` on `.hero-figure`: light bleeding round the lit edge (up-right) and the
  cast shadow (down-left). Tokens `--key-rgb/alpha/rim/grain/shadow`: light theme = faint wash + soft ink shadow, no grain
  (reads as dirt on white); dark = visible beam + rim glow, no shadow. Physical sides on purpose (the photo is not mirrored
  in RTL). `.hero-cut` now clips both axes so the shadow never falls under the trust strip rule. Static, no JS, off in forced colours.

- 2026-11-17 Spec mode removed (owner review); to be reimplemented later. Deleted: `src/scripts/spec`, SpecToggle, SpecHook,
  `data-spec` markup, the `S` shortcut (`shortcuts.ts` now handles `/` search only, same off switch), spec i18n strings, the
  `--spec` tokens, the `scroll-padding-block-end` that cleared the toggle and the /about colophon. `scripts/lighthouse.mjs` still writes
  `src/data/lighthouse.json`, but nothing renders it. Older entries below that describe Spec mode are history.
- 2026-11-17 text colours (owner review; supersedes the all-blue text of the Aegean entry and the pure-black dark tokens above). Two
  blues now: deep navy is text, bright Aegean is interaction. Light: `--ink` #0b2545 (15.4:1), `--foreground` #25405e (10.6),
  `--muted-foreground` #4a6176 (6.4), `--border` #d5e2ef, `--muted` #eef3f8. The bright blue is a new `--link` token #0d5eaf (6.5:1; also
  `--rule`, `--ring`, `--brand`, `--map-from`, so links, focus, rules and map arcs keep the brand blue); `--link-hover` #0a4f96;
  `--primary` #1565c0 and `--display` #327bc4 unchanged. Dark stays pure black with white text: `--ink` #fff, `--foreground` #ededed,
  `--muted-foreground` #a3a3a3, `--border` #262626, `--muted` #111, `--link` #8ec3f5 (11.3:1), `--link-hover` #b3d6f8, `--primary` #6cb0f0
  (black label). Values live in `global.css`; every pair checked >= 4.5 for text, >= 3 for UI.
- 2026-11-17 home proof merged: Clients worldwide and Testimonials became one `#proof` section (`Proof.astro`; `ClientsMap` has a
  `proof` variant). Each country with a review is a radio on the map (`:has()` shows that review beside it, zero JS); testimonials gain
  a Keystatic `country` field (relationship to `clients`) which decides the map selection; untagged reviews follow as plain cards. The
  `proof` gate in `routes.ts` replaces the separate `clients` and `testimonials` gates (live when there is a client or a review).
  `src/lib/proof.ts` builds the places. Home order: hero, statement, trust, work, proof, services, process, about, FAQ, writing, closing CTA.
- 2026-11-17 dark hero + statement (owner review; inspired by an owner-supplied reference image; supersedes the cutout + Blueprint and
  key-light entries): the hero is `class="dark"` black in both themes with a giant uppercase name, the portrait as a card overlapping
  the name, a CSS `.tick-ring`, mono micro-labels (place, local time, email) and pill doors (WhatsApp, CV). The name is a real `<p>`;
  the H1 stays the outcome headline. `Statement` follows (centred uppercase line, "More about me" pill, faint tick rings). Removed:
  `.hero-grid` columns, `.hero-key` and its tokens, the Dusk glow on the hero, the cutout portrait (`profile.cutout` and
  `cutout.png` are now unused; the hero uses `photo.jpg`) and the "Press S" line. Dusk now appears only on the 404, the /about portrait
  and the map sparks.
- 2026-11-17 closing CTA: `ContactBlock` is a flat two-column block (statement left, contact paths right; no gradient), with
  `location` and `form` props; `SiteFooter` renders it as `footer_cta`, the home page as `final` with the inline form. The /contact H1
  lost its Dusk glow.
- 2026-11-17 rules and buttons (owner review): the amber `--rule` token and every `border-rule` are gone (separators are
  `--border` hairlines where structure needs them, otherwise removed); the footer wordmark (and its `.wordmark-light`,
  `--brand-display` and the footer grid's `relative z-10`) is gone; buttons morph shape and turn their arrow instead of
  lifting with a pink halo, and project cards morph their frame corners instead of lifting.

- 2026-11-17 trust strip -> hero proof line (owner review): the four-column strip under the Statement is gone; `TrustStrip` now
  renders inside the hero between subline and doors: five stars (fills pop once in sequence, `[--i:n]`), "5.0", a claims chip
  and "Verified on Upwork". The chip's `<ul>` holds every claim (no aria-live); with motion, `:has()` and on screen it becomes a
  one-line slot that rolls twice (2 x 12 s) and rests on the badge; paused on hover/focus-within, a zero-JS checkbox pauses and
  shows the full list, keyboard focus on the countries link does the same. Reduced motion, print and no `:has()` show the list. Zero JS.
- 2026-11-17 review loop variant A chosen; thread moved to Process; time-zone table removed (owner review). The home proof loop is
  the chat bubble (A); the toast (B) code and the `/lab/reviews` lab are gone (`devLab` in `astro.config.mjs` keeps one `injectRoute`
  per lab). The conversation-thread look (C) became the "How we work" section: `ProcessThread` is scroll-linked (user controlled, so
  no pause control is needed and no timer runs) rather than a timed loop, which also lets full-length messages show unclamped. Process
  steps gained `messages` (from founder or me) in Keystatic, replacing the unused `text`; the copy is `[Draft]` and only restates
  facts already on the site (WhatsApp or a call, written scope and quote, one engineer from first call to launch, weekly updates,
  documented handover, support). `src/lib/overlap.ts`, the `home.tz.*` strings and the table are gone; `home.process.timezone`
  keeps one line ("full overlap with European working hours", as in the footer and closing CTA).

- 2026-11-18 review round (owner): **About = variant B "Two readers"** (founder story + practices, recruiter spec card with CV HTML/PDF),
  `/lab/about` removed. **Springs**: M3 Expressive spring tokens (`src/lib/spring.ts`), applied to buttons, arrows, cards, the theme glyph
  and a livelier portrait morph (13.4 s loop). **Tick rings replaced** by `MorphShape` (scroll-linked morph + twist + tone; `--shape-*`
  tokens; amber in the shapes is a warm tertiary pending owner OK, given the Dusk rule). **Map stripped** to land dots + flashlight (no
  client markers, arcs/sparks, base marker or "Based here", no legend, `ClientsMapStyle` deleted). **Reviews two at a time** from 64rem
  stage width (container query `rl`): a bubble pops every 6 s and lives 10.5 s, so pops and exits never coincide; loop order and bubble
  side are planned at build time so neighbours never overlap (falls back to one at a time); spring pop from the country point; bubbles
  name their country; country radios moved into chips under the map ("All" resets). Labs opened: `/lab/header` (nav
  hover: A state layer, B glide, C morph, D roll; C shipped 2026-11-20, lab deleted) and `/lab/hero` (A quiet, B starlit,
  C moonrise, D night (recommended): decluttered copy, rating stars scattered as a twinkling night sky, Statement merged into the hero).
  Labs register in `devLab` (`astro.config.mjs`), dev only.
- 2026-11-20 header nav: owner picked `/lab/header` variant C "Morph" (a shape that grows from the current-page dot and inverts
  labels; toggle and GitHub join it). The per-tab underline and 3px current bar are gone; the lab is deleted.
- 2026-11-20 reviews (owner): **loop faster**: a new review every 3.2 s wide (lives 3.8-5.0 s, scaled by quote length within the
  two-track rules), 3.6-5.4 s narrow. **Queued client avatars**: the next client's avatar pops at its country and shows typing dots
  for ~1.2 s, then the bubble grows out of it; the planner keeps bubbles clear of the other visible avatar. **`playback` prop**
  (`loop` | `scroll`, switched by one const in `src/pages/index.astro`; home stays on `loop`): `scroll` pins the map under the header over
  40svh per review and steps through the reviews with the same timed spring entries, never scrubbed. A tiny script limits it to one
  review per 0.9 s so a fling never flashes reviews; it never moves the scroll, so a hard fling can still leave the section (no
  hijacking). CSS scroll snap was rejected after real-input tests (proximity pulled notched wheels back to the current step;
  mandatory trapped End). No JS, or viewports under 30rem tall: plain cards. Dev-only `/lab/proof` shows the scroll mode in context.
- 2026-11-20 hero lab round 2 (owner chose D "alive" with changes): `/lab/hero` now holds four refinements of D with white stars,
  nothing behind the portrait and one pause control for all hero motion: A Breath (slow circle/cookie breathing, zenith sky),
  B Starlight (still circle, night grade + 1px rim lit from the upper right, radial sky; recommended), C Orbit (orbit ring with one star,
  ink sky), D In step (portrait winks in time with a rating star, indigo sky). Proposed `--night-*`/`--star` tokens are in the lab.
- 2026-11-20 hero restart (owner review: the live hero is too busy, does not match the site and looks low quality): the round-2
  hero lab is deleted; the hero is redone from scratch with the Hallmark skill. The review loop no longer pauses on hover over the
  map (owner); the Auto-play switch and focus in the country chips still pause it.

## Do not

- Do not ship Keystatic routes to production; keep the integration dev-only.
- Do not add heavy animation libraries (framer-motion, GSAP) without a measured reason.
- Do not add a captcha; use a honeypot.
- Do not require more than 3 fields in the contact form.
- Do not hardcode UI strings or ship JS where plain Astro/CSS suffices.
- Do not commit `.env` or secrets.
