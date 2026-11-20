# Launch checklist

Everything left before and after the first deploy, ordered by impact. The build is feature complete; what remains is
content, Vercel setup and verification. Placeholders: `[TBD]` = missing fact, `[Draft]` = copy awaiting review.
Edit content with `pnpm dev` and `http://localhost:4321/keystatic` (or the YAML/Markdoc files below).

## 1. Content (blocks launch: placeholders are visible on production pages)

- [ ] **Home hero**: replace the `[Draft]` headline and subline (`src/content/en/home/index.yaml` `hero`) and set `shortBio`
      (`src/content/en/profile/index.yaml`). Feeds the meta description, OG, Person JSON-LD, `/llms.txt`, About teaser.
- [ ] **Hero statement**: review the new centred statement copy under the hero (`src/i18n/en.ts`, `home.statement.body`).
- [ ] **Testimonial countries**: set `country` on every testimonial in Keystatic (Testimonials -> Country; Solana, React product page and React form app carry RANDOM placeholder countries marked `[TBD]`, the
      real client country is not in the repo, so it is an owner fact). The home proof map
      picks a review by country; untagged reviews fall back to plain cards below the map. Countries available: France, Germany,
      India, Singapore, Spain, United States, Tunisia.
- [ ] **Services**: who it is for / what you get for the 4 offers (`home/index.yaml`, Keystatic: Home).
- [ ] **Process**: the `[Draft]` chat messages of the 4 steps (`home/index.yaml`, `process[].messages`) and "How quotes work".
- [ ] **FAQ**: answers on code ownership, after launch, NDA, Upwork vs direct; drop `[Draft]` on the other answers.
- [ ] **About**: story (`profile/longBio.mdoc`), how I work (`profile/howIWork.mdoc`), research summary
      (`profile/index.yaml`), and the "A few things about me" row (`[TBD] Label/Value`: fill or delete).
- [ ] **CV** (`/cv` and `/cv.pdf`): summary (`profile/index.yaml`), skills Languages/Backend/Infrastructure
      (`src/content/en/skills.yaml`), university name, dates and research focus (`src/content/en/education/*.yaml`).
- [ ] **Experience**: replace the `[TBD]` result bullets in `src/content/en/experience/freelance-full-stack-engineer.yaml`,
      add real dates, set `draft: false`.
- [ ] **Privacy** (`src/i18n/en.ts`, `privacy.*`): confirm retention (12 months), processors (Resend, Vercel; add Cloudflare
      Email Routing and Gmail if `hello@` is the contact address), rights text; remove `[Draft]`; update "Last updated".
- [ ] **Time-zone line**: `src/i18n/en.ts` time-zone copy (`home.process.timezone`, `cta.timezone`, `footer.base`, `clients.caption`); soften "full overlap with European working hours".
- [ ] **Claims to confirm**: "usually replies within an hour" (WhatsApp), "I reply within a day" (email/form);
      "Clients in 7 countries" (counts Tunisia, the home country: confirm it is the Upwork tally, or list 6 / label Tunisia as home).
- [ ] **Unlock Work**: publish at least 2 projects (`src/content/en/projects/*`: remove `draft`, replace every `[TBD]`
      incl. `clientType` and `outcome`; add `links` so `project_link` events exist). The research project title is `[TBD]`.
- [ ] **Unlock Writing**: publish at least 3 posts (`src/content/en/posts/*`: real descriptions, `draft: false`).
      Gated sections, nav, RSS and sitemap entries appear by themselves once the gates pass.
- [ ] Finish: `grep -rn "\[TBD\]\|\[Draft\]" src/content src/i18n` is empty, and so is
      `grep -rl "\[TBD\]\|\[Draft\]" .vercel/output/static` after a plain `pnpm build`.

## 2. Vercel setup

- [ ] Create the project from the repo; framework Astro (the adapter writes `.vercel/output`).
- [ ] Enable **Web Analytics** (the site loads the same-origin `/_vercel/insights/script.js`; nothing else to install).
- [ ] Environment variables (Production and Preview): `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`
      (see `.env.example`). Without them `/api/contact` answers 503 and the form shows the email fallback.
- [ ] Resend: verify the sending domain (DNS records for `deyra.dev`) so `CONTACT_FROM_EMAIL` can send.
- [ ] Cloudflare Email Routing: `hello@deyra.dev` -> your inbox (the address shown on the site and in `settings.yaml`).
- [ ] Attach the domain `deyra.dev`; confirm HTTPS and the trailing-slash 308.
- [ ] Once stable (a few weeks, all subdomains on HTTPS): submit `deyra.dev` at hstspreload.org (the header already
      sends `max-age=63072000; includeSubDomains; preload`).
- [ ] Search Console: add the property, submit `https://deyra.dev/sitemap-index.xml`.

## 3. Verify after the first deploy

- [ ] **CSP on a preview**: open `/`, `/contact`, `/blog`, `/404` with DevTools console open: no `securitypolicyviolation`.
      Compare with the route CSPs in `.vercel/output/config.json` (`config/security-headers.mjs` adds them).
- [ ] **Unknown URL**: `curl -I https://<preview>/nope` returns 404 with a `content-security-policy` header.
- [ ] **Trailing slash**: `curl -I https://<preview>/about/` returns 308 to `/about`.
- [ ] **Headers scan**: securityheaders.com and Mozilla Observatory on the production URL (expected A/A+).
- [ ] **Lighthouse**: once content is final, re-run `pnpm build && node scripts/lighthouse.mjs` (writes `src/data/lighthouse.json`;
      scores are no longer shown on the site since Spec mode was removed, so this is an audit record only), commit it and rebuild.
- [ ] **Contact form end to end**: submit on `/contact` with JS on and off; the mail arrives with the visitor as
      reply-to; then break the key once and check the Vercel function logs show `contact: resend failed, status ...`.
- [ ] **Analytics**: click WhatsApp, CV, email in production; events appear in the Vercel dashboard (events: `docs/ux-study.md` section 9).
- [ ] `pnpm audit` (script: `pnpm run audit`): the high advisory is cleared by `pnpm-workspace.yaml` overrides; one moderate
      `minimatch` advisory remains (CLI/dev only, not in the deployed bundle).

## 4. Owner options (not blocking)

- [ ] Recolour `public/favicon.svg`, `favicon.ico`, `apple-touch-icon.png` to the blue palette (still the black "D" tile).
- [ ] CI: a workflow running `pnpm build`, `pnpm check` and `pnpm run audit` on every PR (deliberately not added).
- [ ] Replace the AI-generated portrait (`src/content/en/profile/photo.jpg`, same file name or via Keystatic); the hero now uses the
      photo card.
- [ ] Clean-up: `src/content/en/profile/cutout.png` (and the optional `cutout` field in `keystatic/locale.ts` / `profile/index.yaml`) and the
      `home.hero.eyebrow` key in `src/i18n/en.ts` are unused since the 2026-11-17 hero redesign: delete them or keep for a future hero.
- [ ] Drop `@astrojs/react` (and `react`, `react-dom`) if no island is planned: `/_astro` ships a 220 KB React client
      runtime that no page loads. Keep it if a shadcn island is coming.
- [ ] Contact copy: consider adding an availability line once you want one (decision log: no badge for now).
