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

- Marketing site uses static sample data in `src/data/`.
- Apply form is local-state only (no submit endpoint); shows a thank-you state after submit.
- **Digital Passport** is backend-wired (Postgres + Express). Visitor accounts, businesses, and stamp collection live in `@workspace/db`; API contract lives in `lib/api-spec/openapi.yaml`; React Query hooks come from `@workspace/api-client-react` (Orval codegen). Visitor id persists in `localStorage` (`atlanta-passport-visitor-id`) via `VisitorProvider`.
- **Social login (Replit-managed Clerk)** — the "Start your passport" form (`src/passport/StartPassportForm.tsx`) offers real social sign-up (Google + Apple + X + Facebook; Instagram intentionally dropped — Meta deprecated consumer Instagram Basic Display) below the email form. All Clerk wiring lives in `src/auth/clerk.tsx`: `ClerkProviders` (wraps the app inside `WouterRouter`, routerPush/Replace strip the base path), branded `SignInPage`/`SignUpPage` (path-routed at `/sign-in`/`/sign-up`, handle the `…/sso-callback`), `SocialAuthButtons` (custom buttons with inline brand glyphs; uses `useSignUp` from **`@clerk/react/legacy`** — the v6 signals-based default `useSignUp` has no `authenticateWithRedirect`). `ClerkVisitorBridge` ties a Clerk account to the passport `visitor` record: while signed in it calls `POST /api/visitors/link` (get-or-create by `clerkUserId`) and makes that the active `visitorId` so the same account = same passport on every device; on sign-out/account-switch it drops the linked visitor (anonymous email-form visitors are left untouched). Server: `clerkMiddleware` + a Clerk proxy (`/api/__clerk`) in `api-server/src/app.ts`; `/api/visitors/link` derives identity from `getAuth(req)` (never client input). Schema: `visitors.clerkUserId text unique`. Secrets: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`. **Provider enablement is a Clerk-dashboard step** — only Google is on by default; Apple/X need toggling and Facebook needs a Meta app (custom OAuth) for Production. Home `/` stays public (marketing site — no signed-in redirect).
- Routing via `wouter` with base path `import.meta.env.BASE_URL`. App.tsx splits routing by URL prefix: `/stamp/:slug` (full-bleed), `/admin/stamps` (admin), `/sign-in/*?` & `/sign-up/*?` (Clerk auth pages), the MapShell routes (see below — Router returns null, checked BEFORE the `/passport` branch), `/passport` (PassportLayout w/ bottom nav — profile home only), everything else (marketing Layout w/ Navbar+Footer).
- **Persistent MapShell** (`src/passport/MapShell.tsx`): the `/explore`, `/explore/events`, `/passport/stamps`, `/passport/rewards`, and `/passport/routes` routes (`isMapShellRoute` in App.tsx) share ONE always-mounted shell so the Google map never reloads/recenters when switching between them. `PersistentMapShell` in App.tsx mounts it once on first visit and toggles `visibility` (not unmount) on a `fixed inset-0 z-30` container. MapShell owns the shared filter state (categories/neighborhood/search/selectedBizId/selectedRouteId) + the pinned `BusinessMap`, and swaps the content below the map by `view`: `/explore` → `ExploreContent` (`src/pages/explore.tsx`, presentational/props-driven — filters + results, no map/state), `/explore/events` → `EventsFeed` (`src/passport/EventsFeed.tsx`, event cards; clicking focuses the venue on the map, "View event" → `/events/:id` marketing detail), `/passport/routes` → `RoutesFeed` (`src/passport/RoutesFeed.tsx`, route cards from `mapRoutes`; clicking a card highlights that route — see below), `/passport/stamps` → `PassportStamps` and `/passport/rewards` → `PassportRewards` wrapped in `PassportPanel` (a scroll container mirroring PassportLayout's cream/texture bg + `max-w-3xl` padding + `pb-28`). Each view is conditionally rendered, so its hooks only run on its route. Deep-link `?category=`/`?neighborhood=` sync is gated to `/explore*` so other pages can't clobber in-session filters. Marketing `/events` + `/events/:id` still exist for the marketing layout; `/passport` (home) still uses PassportLayout (no pinned map).
- **Map routes** (`mapRoutes` in `src/data/sample-data.ts`): curated routes, each an ordered list of `businessIds` (real listed spots). On `/passport/routes`, clicking a `RoutesFeed` card sets `selectedRouteId` in MapShell → the shared map shows ONLY that route's stops (ordered) and `BusinessMap` draws a yellow `RoutePath` polyline connecting them + fits bounds; clicking the active card again clears it (map shows all spots). With no route selected the map shows all businesses. `BusinessMap` accepts an optional `routePath?: {lat,lng}[]` prop.
- No FIFA branding anywhere — independent guide; disclaimer in footer.

## Passport stamp system

- **Schema** (`lib/db/src/schema/`): `visitors`, `businesses`, `stamps` (unique `(visitorId, businessId)` to prevent duplicates).
- **Server seeds** 6 sample businesses on boot (`artifacts/api-server/src/lib/seed.ts`) — idempotent via `onConflictDoNothing(slug)`. Push schema with `pnpm --filter @workspace/db run push`.
- **Endpoints**: `POST /api/visitors`, `GET /api/visitors/:id`, `GET /api/visitors/:id/stamps`, `GET /api/businesses`, `GET /api/businesses/:slug`, `POST /api/stamps` (returns `{stamp, alreadyCollected}`).
- **Frontend pages**: `/stamp/:slug` (auto-collects after passport exists; full-screen success), `/passport` (profile/home), `/passport/stamps` (filterable grid: All / Neighborhoods / Categories), `/passport/rewards` (5/10/20 + neighborhood thresholds), `/passport/routes` (curated `mapRoutes` cards that highlight a route's stops on the shared map), `/admin/stamps` (QR + copy-link grid using qrserver.com).
- **Reward thresholds** (in `src/passport/data.ts`): 5 = Weekly Giveaway, 10 = Secret Route Access, 20 = Grand Prize, 5-in-neighborhood = Secret Neighborhood Route. Secret routes require: Midtown After Dark (5 Midtown), Hidden Atlanta (10 total), Eastside Night Run (10 total), Local Favorites (20 total).
- **Brand stamp graphic** (`src/passport/StampGraphic.tsx`): circular SVG with neighborhood arc-text, ATL center, lucide icon, EXPLORED + date arc. Color palette maps to brand tokens (yellow/red/lime/cream/navy/orange/sky). `locked` prop greys it out and swaps icon to Lock.
- **Bottom nav** (`PassportLayout`): Home (/) · Stamps · Routes · Rewards · Profile (/passport).
- **Wouter v3 convention**: pass `className` directly on `<Link>`, never wrap with a child `<a>` (causes nested-anchor hydration error).
- **Codegen gotcha**: don't name an OpenAPI schema `XxxResponse` if there's an operation named `xxx` — orval generates an operation response constant with the same name, causing duplicate-export collision in `@workspace/api-zod`. (We use `StampCollection` for the `POST /stamps` body schema.)
- **Codegen gotcha 2**: orval-generated react-query hooks require explicit `queryKey: getXxxQueryKey(...)` inside the `query` options object (react-query v5 typing). Generated `XxxBody` zod schemas (not `XxxInput`) are the value exports; the `Input` names from the OpenAPI components only become TS types.

## Product

Marketing site with: Home, Become a Partner (Starter $100 / Featured $300 / Premier $500), Explore (filterable by category & neighborhood), Business Listing template (Wheelhaus Bikes as showcase), Events, Beltline Tour, About, and Apply onboarding form. Visual identity is playful retro Americana — yellow block "ATL/PASSPORT" wordmark, thick black borders, offset "pop" shadows.

**Tourist-first UX:** Header has no Apply CTA (Explore instead). Mobile menu has a separated "For Businesses" section (cream block at bottom). Footer has a "For Businesses" mini-card on every page. Business CTA only appears once on home — at the bottom, presented as a curated/limited offer.

**Home page order:** Marquee → Hero (Explore Atlanta + View Routes + horizontal chip nav) → Explore by Category → Featured Experience (Beltline + numbered route stops) → Routes & Collections (with stops/miles/pace metrics) → Selected Local Spots ("worth leaving the hotel for") → Neighborhoods (alternating cream cards reduce saturation) → How It Works (compact 4 steps) → Manifesto (red block, moved lower) → Business CTA ("Put your business on Atlanta's route map" / Get Listed) → Footer.

**Mobile safety:** `html/body/#root` have `overflow-x:hidden + max-width:100vw` to prevent rogue horizontal scroll from decorative offsets/stamps. `.button-pop` is `nowrap` with smaller padding/font (12px 18px / 0.82rem) on mobile and full size (14px 24px / 0.95rem) at sm+. Hero CTAs use `grid grid-cols-2 sm:flex` so two short-labeled buttons share a row on iPhone widths. Mobile navbar CTA is short ("Explore"); desktop nav uses "Start Exploring".

**Brand primitives (in `src/index.css`):** `.card-pop`, `.button-pop` (+`-yellow`/`-cream`/`-dark`), `.badge-sticker`, `.sticker-pill` + `.sticker-{yellow,red,cream,navy,lime,sky,orange}`, `.section-kicker`, `.highlight-yellow`, `.hero-title` (mobile clamp 2.25rem), `.passport-stamp`, `.texture-paper`, `.section-tight` / `.section-hero` (mobile-first spacing: 56px / 88px), `.shadow-pop`/`-sm`/`-lg`, `.dot-grid`, `.bg-paper`, `.route-line`, `.progress-track`/`.progress-fill`, `.form-progress-track`/`.form-progress-fill`, `.scroll-fade-r` + `.sm:no-fade` (right-edge mask for horizontal scrollers, disables on sm+). **Reusable React components:** `<Sticker color rotate icon>` and `<PassportStamp size tone rotate>`. Bungee display font; brand palette tokens (`brand-yellow/red/sky/navy/gold/lime/orange/cream` + `brand-yellow-foreground`). Marquee animates 22s mobile / 38s desktop.

**Page conventions:** Events cards use bold typographic date tiles (parsed Month + Day) instead of shared photos. Listing pages show a stamp preview + real Google Maps deep-link (no fake QR/scan UI). Apply form has a sticky `top-16` progress strip showing live `completed/total` of required fields; package picker is 3 tiers (Starter/Featured/Premier) with a text-link "Request a custom package" that selects the `custom` enum.

## Internationalization (i18n)

- `i18next` + `react-i18next` + `i18next-browser-languagedetector` (LocalStorage key `atlanta-passport-lang`).
- 9 locales: en, es, fr, pt, de, it, ja, ko, ar — all under `src/i18n/locales/*.json`.
- Initialized in `src/i18n/index.ts`; imported by `main.tsx`. `applyDir()` strips region (`ar-SA` → `ar`) and sets `dir="rtl"`/`lang` on `<html>` for Arabic.
- Switcher: `<LanguageSwitcher variant="navbar"|"menu" />` (Globe + flag dropdown). Wired into `Navbar` (desktop + mobile menu).
- Translations regenerated via `scripts/translate-i18n.mjs <comma-list>` using the AI Anthropic integration. Brand names (Atlanta Passport, Beltline, Wheelhaus Bikes, World Cup, ATL, $100, TIER, etc.) preserved untranslated.
- Sample data in `src/data/sample-data.ts` (business names/descriptions/addresses/hours) is intentionally NOT translated — out of scope for the marketing site.
- RTL: use `rtl:rotate-180` on directional icons (ArrowRight/MoveRight); use `ltr:`/`rtl:` border/padding pairs where physical sides matter.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Always pair `lg:grid-cols-*` (or `md:`/`sm:`) with an explicit base `grid-cols-1`.** A grid with no column class at the current breakpoint defaults to a single auto-sized track that takes `max-content`, so any child requesting `max-w-2xl`/`max-w-6xl` will blow the grid wider than the viewport on mobile — overflowing past `overflow-x:hidden` clipping. The visible symptom is hero/CTA buttons sized like the viewport is 672px+ wide. Fixed in: hero + featured + CTA on home, hero + offers on beltline, listing main grid, partners pricing tiers.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
