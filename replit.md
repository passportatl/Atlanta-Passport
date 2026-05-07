# Atlanta Passport

A premium, mobile-first marketing site for "Atlanta Passport" — a hyperlocal city guide (physical booklet + digital site) selling sponsorship/listing packages to Atlanta businesses ahead of the 2026 World Cup. Wheelhaus Bikes is the founding sponsor and showcase listing.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/atlanta-passport/` — Atlanta Passport React + Vite frontend (the product)
- `artifacts/atlanta-passport/src/data/sample-data.ts` — businesses, events, neighborhoods, packages, categories, **exploreCategories**, **routes**, **beltlineStops**
- `artifacts/atlanta-passport/src/components/Sticker.tsx` / `PassportStamp.tsx` — reusable brand primitives (color/rotation variants)
- `artifacts/atlanta-passport/src/index.css` — theme tokens, brand palette, all design-system classes
- `artifacts/api-server/` — shared Express API server (currently only `/api/healthz`)
- `lib/api-spec/openapi.yaml` — API contract source of truth

## Architecture decisions

- Frontend-only marketing site — no backend wired up; sample data is static in `src/data/`.
- Apply form is local-state only (no submit endpoint); shows a thank-you state after submit.
- Routing via `wouter` with base path `import.meta.env.BASE_URL`.
- No FIFA branding anywhere — independent guide; disclaimer in footer.

## Product

Marketing site with: Home, Become a Partner (Starter $500 / Featured $300 / Premier $100), Explore (filterable by category & neighborhood), Business Listing template (Wheelhaus Bikes as showcase), Events, Beltline Tour, About, and Apply onboarding form. Visual identity is playful retro Americana — yellow block "ATL/PASSPORT" wordmark, thick black borders, offset "pop" shadows.

**Home page order:** Marquee → Hero (with sticker cluster + passport stamp) → Explore by Category → Featured Experience (Beltline + numbered route stops) → Manifesto (red block) → Routes & Collections → Selected Local Spots → Neighborhoods → How It Works → Partner CTA → Footer.

**Brand primitives (in `src/index.css`):** `.card-pop`, `.button-pop` (+`-yellow`/`-cream`/`-dark`), `.badge-sticker`, `.sticker-pill` + `.sticker-{yellow,red,cream,navy,lime,sky,orange}`, `.section-kicker`, `.highlight-yellow`, `.hero-title`, `.passport-stamp`, `.texture-paper`, `.section-tight` / `.section-hero` (mobile-first spacing: 56px / 88px), `.shadow-pop`/`-sm`/`-lg`, `.dot-grid`, `.bg-paper`, `.route-line`, `.progress-track`/`.progress-fill`. **Reusable React components:** `<Sticker color rotate icon>` and `<PassportStamp size tone rotate>`. Bungee display font; brand palette tokens (`brand-yellow/red/sky/navy/gold/lime/orange/cream` + `brand-yellow-foreground`).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
