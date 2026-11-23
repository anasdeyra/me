# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Clients (primary):** founders, CTOs and product leads of businesses whose product takes bookings or orders, depends on suppliers or partner APIs, or wants AI to remove manual work. They arrive from a referral, LinkedIn, Upwork or search, scan fast, and decide whether one engineer can own a fix end to end. They cannot judge engineering quality upfront and fear overpaying or being left with code nobody understands.
- **Recruiters and hiring engineers (secondary):** looking for software, full-stack or product engineering hires. They need fit, location, work mode and a scannable CV.

## Product Purpose

A personal site for Anas Deyra that exists for conversion: clients send a WhatsApp message (primary), recruiters open the CV. Success is a reached-out visitor, with the least friction.

## Positioning

A product engineer who builds the parts of your product that make money: booking and checkout flows, supplier and API integrations, AI tools and agent workflows. Not a gig freelancer. The proof a neighbour cannot copy is production work at Metis, a B2B travel booking platform (current role since October 2023).

## Operating Context

- Contact paths: WhatsApp (prefilled `wa.me` links), email, a 3-field form, LinkedIn, Upwork, GitHub, CV (HTML and text PDF).
- Based in Tunis, Tunisia (UTC+1 all year); works in English, French and Arabic; remote, hybrid or on-site.
- Engagement: written scope after the first call, fixed price per milestone or time-based against an estimate; no public prices.

## Capabilities and Constraints

- Astro static site on Vercel, Tailwind v4 tokens, Keystatic content (local, dev only). React only for real islands.
- Enforced CSP: no `style=""` attributes, no third-party scripts, fonts or images without a CSP entry; generated CSS goes in hashed inline `<style>`.
- Performance budget: Lighthouse >= 95 everywhere, about 5 KB gz of JS before interaction on `/`.
- "Product engineer" is the positioning label; job titles in experience entries stay as held (Metis: Software Engineer).

## Brand Commitments

- Name "Anas Deyra"; brand wordmark "Deyra"; favicon is a "D" monogram.
- Voice: direct, plain, confident, exact. Words to use: bookings, checkout, suppliers, faster, live, ship, measured, own, maintain. Never: rockstar, ninja, passionate, synergy, cutting-edge, solutions, "freelancer" as the identity, "first in the world".
- WhatsApp CTAs keep the WhatsApp emerald so the primary action is recognised at once.

## Evidence on Hand

- Metis: 8 supplier integrations; end-to-end booking 3x faster (measured by the end-to-end booking test scenarios); NDC booking split and flight exchange for Air France-KLM (sole engineer); Metis was the first technology provider to offer the split with Air France-KLM. Leads the flight module team.
- Upwork: 5.0 rating, 5 reviews, Top Rated, 100% Job Success; clients in 8 countries. Quotes stay verbatim (`src/content/en/testimonials`).
- Career figures (start year, projects shipped) in `src/content/shared/settings.yaml`.
- Portrait: `src/content/en/profile/photo.jpg` (AI-generated stand-in; to be replaced by a real photo).
- Absent, never to be invented: client logos, prices, availability, benchmarks beyond the above, a "world first" claim.

## Product Principles

1. Proof before asks: show the measured result, then the door.
2. Two doors from the top: WhatsApp for clients, CV for recruiters, both above the fold.
3. Plain outcome language a founder reads in one pass.
4. Fast, static and accessible by default; motion is optional, content never waits for it.

## Accessibility & Inclusion

WCAG 2.2 AA: contrast AA, visible focus, keyboard reachable, reduced motion respected, no infinite animations without a pause control, RTL-ready logical properties.
