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

Marketing site with: Home, Become a Partner (Starter $100 / Featured $300 / Premier $500), Explore (filterable by category & neighborhood), Business Listing template (Wheelhaus Bikes as showcase), Events, Beltline Tour, About, and Apply onboarding form. Visual identity is playful retro Americana — yellow block "ATL/PASSPORT" wordmark, thick black borders, offset "pop" shadows.

**Tourist-first UX:** Header has no Apply CTA (Explore instead). Mobile menu has a separated "For Businesses" section (cream block at bottom). Footer has a "For Businesses" mini-card on every page. Business CTA only appears once on home — at the bottom, presented as a curated/limited offer.

**Home page order:** Marquee → Hero (Explore Atlanta + View Routes + horizontal chip nav) → Explore by Category → Featured Experience (Beltline + numbered route stops) → Routes & Collections (with stops/miles/pace metrics) → Selected Local Spots ("worth leaving the hotel for") → Neighborhoods (alternating cream cards reduce saturation) → How It Works (compact 4 steps) → Manifesto (red block, moved lower) → Business CTA ("Put your business on Atlanta's route map" / Get Listed) → Footer.

**Mobile safety:** `html/body/#root` have `overflow-x:hidden + max-width:100vw` to prevent rogue horizontal scroll from decorative offsets/stamps. `.button-pop` is `nowrap` with smaller padding/font (12px 18px / 0.82rem) on mobile and full size (14px 24px / 0.95rem) at sm+. Hero CTAs use `grid grid-cols-2 sm:flex` so two short-labeled buttons share a row on iPhone widths. Mobile navbar CTA is short ("Explore"); desktop nav uses "Start Exploring".

**Brand primitives (in `src/index.css`):** `.card-pop`, `.button-pop` (+`-yellow`/`-cream`/`-dark`), `.badge-sticker`, `.sticker-pill` + `.sticker-{yellow,red,cream,navy,lime,sky,orange}`, `.section-kicker`, `.highlight-yellow`, `.hero-title` (mobile clamp 2.25rem), `.passport-stamp`, `.texture-paper`, `.section-tight` / `.section-hero` (mobile-first spacing: 56px / 88px), `.shadow-pop`/`-sm`/`-lg`, `.dot-grid`, `.bg-paper`, `.route-line`, `.progress-track`/`.progress-fill`, `.form-progress-track`/`.form-progress-fill`, `.scroll-fade-r` + `.sm:no-fade` (right-edge mask for horizontal scrollers, disables on sm+). **Reusable React components:** `<Sticker color rotate icon>` and `<PassportStamp size tone rotate>`. Bungee display font; brand palette tokens (`brand-yellow/red/sky/navy/gold/lime/orange/cream` + `brand-yellow-foreground`). Marquee animates 22s mobile / 38s desktop.

**Page conventions:** Events cards use bold typographic date tiles (parsed Month + Day) instead of shared photos. Listing pages show a stamp preview + real Google Maps deep-link (no fake QR/scan UI). Apply form has a sticky `top-16` progress strip showing live `completed/total` of required fields; package picker is 3 tiers (Starter/Featured/Premier) with a text-link "Request a custom package" that selects the `custom` enum.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Always pair `lg:grid-cols-*` (or `md:`/`sm:`) with an explicit base `grid-cols-1`.** A grid with no column class at the current breakpoint defaults to a single auto-sized track that takes `max-content`, so any child requesting `max-w-2xl`/`max-w-6xl` will blow the grid wider than the viewport on mobile — overflowing past `overflow-x:hidden` clipping. The visible symptom is hero/CTA buttons sized like the viewport is 672px+ wide. Fixed in: hero + featured + CTA on home, hero + offers on beltline, listing main grid, partners pricing tiers.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
