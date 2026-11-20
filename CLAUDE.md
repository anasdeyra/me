@AGENTS.md

## Claude-specific notes

Project skills live in `.claude/skills/` (pinned in `skills-lock.json`). Use them as follows:

- `product-marketing`: run first; creates the shared positioning/ICP context at `.agents/product-marketing.md` that the other marketing skills read.
- `copywriting`, `copy-editing`, `cro` (page and form conversion), `marketing-psychology`: messaging, headlines, CTAs, the contact form (<= 3 fields), proof/testimonials.
- `frontend-design`: visual and layout work; keep within the Tailwind tokens and shadcn components.
- `vercel-react-best-practices`: React islands only (ignore Next.js-specific rules).
- `schema`: Person / JSON-LD and other structured data.
- Pre-merge audits: `web-design-guidelines`, `accessibility`, `seo`, `performance`, `core-web-vitals`, `best-practices`, `web-quality-audit`.

- `grill-with-docs` (global skill, `~/.claude/skills/grill-with-docs`): always use it on this project. Run it before any plan, design or non-trivial change, so the plan is checked against the documented decisions in AGENTS.md and `docs/`, and update those docs inline when decisions change.

Workflow: read AGENTS.md, make the smallest change, run `pnpm build` and `pnpm check`, then audit with the relevant skill.
Do not commit or push unless asked.
