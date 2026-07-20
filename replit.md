# Atlanta Passport

A premium, mobile-first city-guide product (physical booklet + digital site) for Atlanta ahead of the 2026 World Cup. It sells sponsorship/listing packages to local businesses and gives tourists a stamp-collecting "passport". Wheelhaus Bikes is the founding sponsor/showcase listing. Independent guide — no FIFA branding; disclaimer in footer.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks + Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `ADMIN_SECRET` (admin API key — no built-in fallback; admin routes return 503 when unset). Clerk secrets: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`.

## Stack

pnpm workspaces · Node 24 · TypeScript 5.9 · Express 5 · PostgreSQL + Drizzle ORM · Zod (`zod/v4`) + `drizzle-zod` · Orval API codegen (from OpenAPI) · esbuild (CJS bundle) · React + Vite frontend · wouter routing · i18next.

## Where things live

- `artifacts/atlanta-passport/` — React + Vite frontend (the product).
- `src/data/sample-data.ts` — businesses, events, neighborhoods, packages, categories, `exploreCategories`, `routes`/`mapRoutes`, `beltlineStops`, plus `STAMP_IMAGE_BY_ID`/`STAMP_IMAGE_BY_SLUG`.
- `src/data/business-sheet-data.ts` — auto-generated content overrides (`description`/`about`/`offer`/`hours`/`address`) from the partner Google Sheet (BUSINESS tab), keyed by business `id`. `businesses = businessesRaw.map(b => override ? {...b, ...override} : b)` — sheet is authoritative for those text fields; curated fields (lat/lng, image, transit, sponsorTier, categories, structured menu) are preserved. To refresh copy, regenerate this file — don't hand-edit those fields in `sample-data.ts`.
- `src/index.css` — theme tokens, brand palette, all design-system classes.
- `src/components/Sticker.tsx` / `PassportStamp.tsx` — reusable brand primitives.
- `artifacts/api-server/` — shared Express API server.
- `lib/api-spec/openapi.yaml` — API contract source of truth.

## Architecture decisions

- Marketing site uses static sample data in `src/data/`. Apply form posts to `/api/applications` (business/event branches); shows thank-you state.
- **Digital Passport** is backend-wired (Postgres + Express). Visitor accounts, businesses, stamps live in `@workspace/db`; React Query hooks come from `@workspace/api-client-react` (Orval). Visitor id persists in `localStorage` (`atlanta-passport-visitor-id`) via `VisitorProvider`.
- **Account sign-up (Replit-managed Clerk)** — all wiring in `src/auth/clerk.tsx`. The "Start your passport" form (`src/passport/StartPassportForm.tsx`) is a real Clerk email+password sign-up with email-code verification, plus social sign-up (Google, Apple, X, Facebook; Instagram dropped). Two-step (`form`→`verify`): `signUp.create({emailAddress, password, unsafeMetadata:{firstName, phone}})` + `prepareEmailAddressVerification`, then `attemptEmailAddressVerification` + `setActive` (guarded on `status==="complete" && createdSessionId`). firstName/phone ride in `unsafeMetadata` (Clerk name attribute is OFF); `/api/visitors/link` reads them server-side. Custom social buttons use `useSignUp` from **`@clerk/react/legacy`** (v6 default has no `authenticateWithRedirect`). Includes `<div id="clerk-captcha"/>`. `ClerkVisitorBridge` ties a Clerk account to a passport `visitor` (get-or-create by `clerkUserId` via `POST /api/visitors/link`, identity from `getAuth(req)` only) so same account = same passport on every device; drops the linked visitor on sign-out (anon email-form visitors untouched). No manual nav after sign-in — `/passport` and `/stamp/:slug` react to the new `visitorId`. Server: `clerkMiddleware` + Clerk proxy (`/api/__clerk`). Schema: `visitors.clerkUserId text unique`. **Provider enablement is a Clerk-dashboard step** (only Google on by default). Home `/` stays public.
- **Routing** via `wouter`, base path `import.meta.env.BASE_URL`. App.tsx splits by URL prefix: `/stamp/:slug` (full-bleed), `/admin/stamps`, `/sign-in/*?` & `/sign-up/*?` (Clerk), MapShell routes (checked BEFORE `/passport`), `/passport` (PassportLayout + bottom nav), else marketing Layout (Navbar+Footer). Marketing routes: `/`, `/partners`, `/events/:id`, `/routes/:id`, `/apply`, `/listing/:id`, else NotFound.
- **Detail pages** — one convention: a record selected from a list opens a dedicated marketing-layout detail page: `/listing/:id` (location), `/events/:id` (event), `/routes/:id` (route). `route-detail.tsx` mirrors event-detail's hero/body/sidebar: hero tinted by `route.color`, Start/Time selectors (default `marta`/`noon`) driving `resolveRoute`, ordered stop list with per-stop `~Xm`, sidebar, prev/next cards, route-level `description` callout + per-stop `stopNotes` "Route Info" (both safe-cast, optional sheet fields).
- **Persistent MapShell** (`src/passport/MapShell.tsx`): `/passport/explore`, `/passport/events`, `/passport/stamps`, `/passport/routes` (`isMapShellRoute`) share ONE always-mounted shell so the Google map never reloads when switching. `PersistentMapShell` toggles `visibility` (not unmount) on a `fixed inset-0 z-30` container. MapShell owns shared filter state (categories/neighborhood/search/selectedBizId/selectedRouteId) + the pinned `BusinessMap`, swapping content below by `view`: `/explore`→`ExploreContent` (presentational; also a curated-route `<select>` that sets the SAME shared `selectedRouteId`), `/events`→`EventsFeed`, `/routes`→`RoutesFeed`, `/stamps`→`PassportStamps` in `PassportPanel`. Each view conditionally rendered (hooks run only on its route). Deep-link `?category=`/`?neighborhood=` sync gated to `/explore*`.
- **Map routes** (`mapRoutes`): curated routes from real listed spots. Sponsored routes are authoritative from the partner Sheet (ROUTES tab) — `byTime.{morning,noon,night}` use the SAME fixed sheet order; optional `description` + `stopNotes`. Every route has `byTime` ordered `businessId` lists + `starts: {marta, parking}`. `resolveRoute(route, start, time)` picks the time-of-day list, reverses for `parking`, computes haversine per-leg distances, sizes the day to ~4–6h via walking minutes + per-stop visit time (`visitMinutes`, else `VISIT_MINUTES_BY_CATEGORY`); returns `miles`, `duration`, `legs[]`, `visits[]`. On `/passport/routes`, clicking a card sets `selectedRouteId` → map shows ONLY that route's ordered stops + a yellow `RoutePath` polyline + fits bounds; clicking again clears. `BusinessMap` accepts optional `routePath?: {lat,lng}[]`.

## Passport stamp system

- **Schema** (`lib/db/src/schema/`): `visitors`, `businesses`, `stamps` (unique `(visitorId, businessId)`).
- **Server seeds** 6 sample businesses on boot (`api-server/src/lib/seed.ts`) — idempotent via `onConflictDoNothing(slug)`.
- **Endpoints**: `POST /api/visitors`, `GET /api/visitors/:id`, `GET /api/visitors/:id/stamps`, `GET /api/businesses`, `GET /api/businesses/:slug`, `POST /api/stamps` (returns `{stamp, alreadyCollected}`).
- **Pages**: `/stamp/:slug` (auto-collects after passport exists; full-screen success), `/passport` (home), `/passport/stamps` (filterable grid: All / Neighborhoods / Categories), `/passport/routes` (cards highlighting a route on the shared map), `/admin/stamps` (QR + copy-link grid via qrserver.com).
- **Admin QR & published domain**: `/admin/stamps` builds URLs from `window.location.origin`, so QR from the private `*.replit.dev` host is Replit-gated. The page detects a non-public host (`isPublicHostname`) and shows a "Published site URL" field — paste the live `.replit.app`/custom domain once (`localStorage` `atlanta-passport-published-url`, validated to a public origin) so QR/links encode that public origin. Stamp collection (`/stamp/:slug`) is public, needs only a Clerk passport account. Admin/stamp pages use **DB** slugs (from `useListBusinesses`), which differ from marketing `sample-data` ids.
- **Adding a stamp spot** needs BOTH a frontend list entry AND a `seed.ts` row — editing only one is broken.
- **Rewards page removed.** `/passport/rewards` + the My-Passport "Next reward" card deleted. `REWARDS` data stays in `src/passport/data.ts` — still used by the "Completed Passports" stat.
- **Prize tiers** defined ONCE as `PRIZE_TIERS` (exported from `src/components/PrizesSection.tsx`): 5 tiers keyed by stamp threshold (3/7/10/13/15), prize `options[]` (brand/prize names NOT translated). Consumers: `<PrizesSection>` (big navy marketing block on home + signed-in area) and `<PrizeLadder collected={n}>` (`src/passport/PrizeLadder.tsx`) — compact progress-aware ladder on `/passport/stamps` under the counter, marking each tier unlocked (`collected >= stamps`) or "N to go". `collected` = participating spots + bonus event stamps. Wrapper copy under `prizes.*` (`ladderTitle`/`unlocked`/`toGo`/`limited`/`choose`/`stamps`).
- **Brand stamp graphic** (`src/passport/StampGraphic.tsx`): circular SVG (neighborhood arc-text, ATL center, lucide icon, EXPLORED + date arc); palette → brand tokens. `locked` greys + swaps to Lock. Optional `iconUrl` (per-business full custom stamp PNG from the partner sheet) replaces the ENTIRE generated stamp — rendered full-bleed (`w-full h-full object-contain`) at `size` when present AND not locked (the PNG is a complete circular stamp design, NOT a center icon; the generated SVG ring/arc-text/EXPLORED-date is skipped for those). Locked custom stamps still use the generic greyed Lock treatment. `stamps.tsx`/`StampChecklist.tsx` key by sample-data **id**; `index.tsx`/`stamp.tsx` (DB-backed) key by **slug**.
- **Bottom nav** (`PassportLayout`): Explore · Routes · Events · Stamps · Contact · Profile.
- **Codegen gotchas**: (1) don't name an OpenAPI schema `XxxResponse` if an operation `xxx` exists (orval duplicate-export collision — we use `StampCollection`). (2) orval react-query hooks need explicit `queryKey: getXxxQueryKey(...)`; `XxxBody` zod schemas (not `XxxInput`) are the value exports.

## Product

Marketing site: Home, Become a Partner (Starter $100 / Featured $300 / Premier $500), Explore (filter by category + neighborhood), Listing template (Wheelhaus Bikes showcase), event/route/location detail pages, Apply onboarding form. Visual identity: playful retro Americana — yellow block "ATL/PASSPORT" wordmark, thick black borders, offset "pop" shadows.

- **Tourist-first UX:** Header CTA is Explore (no Apply). Mobile menu + footer have a separated "For Businesses" block. Business CTA appears once on home (bottom), as a curated/limited offer.
- **Home order** ("Field Guide" sales tool): Marquee → Hero (typographic, parallax via `useScroll`, primary CTA → `/sign-up`) → Pillars (5 value props, zigzag route-line) → Journey (navy horizontal-scroll route cards) → Spots & Events (orange grid of featured events + businesses) → Business CTA (red, → `/apply`) → Prizes (`<PrizesSection/>`) → Footer. Sections are components in `home.tsx`; `PrizesSection` is shared (also rendered in `PassportLayout.tsx`). Copy under `home.*`; pillar circle colors use an explicit `bg`/`fg` class map (never dynamic `bg-brand-${var}`).
- **Mobile safety:** `html/body/#root` use `overflow-x:hidden + max-width:100vw`. `.button-pop` is `nowrap`, smaller on mobile. Hero CTAs use `grid grid-cols-2 sm:flex`.
- **Brand primitives** (`src/index.css`): `.card-pop`, `.button-pop` (+`-yellow`/`-cream`/`-dark`), `.badge-sticker`, `.sticker-pill` + `.sticker-{color}`, `.section-kicker`, `.highlight-yellow`, `.hero-title`, `.passport-stamp`, `.texture-paper`, `.section-tight`/`.section-hero`, `.shadow-pop`/`-sm`/`-lg`, `.dot-grid`, `.bg-paper`, `.route-line`, `.progress-track`/`.progress-fill`, `.form-progress-*`, `.scroll-fade-r` + `.sm:no-fade`. Components: `<Sticker>`, `<PassportStamp>`. Bungee display font; brand palette `brand-yellow/red/sky/navy/gold/lime/orange/cream` (+ `-foreground`).
- **Page conventions:** Event cards use typographic date tiles. Listing pages show a stamp preview + real Google Maps deep-link (no fake QR), optional logo chip top-right of hero (safe-cast). Apply form has a sticky `top-16` progress strip; package picker is 3 tiers + a "Request a custom package" text-link (`custom` enum).
- **Apply form — Business vs Event toggle** (`src/pages/apply.tsx`): a `submissionType` dropdown (`business`|`event`). `isEvent` drives conditional labels, event-only fields (`eventDate`*/`eventTime`/`eventVenue`*/`eventCost`/`eventUrl`), and hides business-only blocks. One `formSchema.superRefine` branches per type; `onSubmit` forces `package:"event"` for events. Server (`api-server/src/routes/applications.ts`) re-validates the branch and nulls the other branch's fields on insert; email gated on `isEvent`. Contract: `submissionType` enum [business,event] + 5 event fields in `SubmitApplicationInput`/`Application`; `package` optional in spec (server defaults the notNull DB column). DB adds `submissionType` (default 'business') + nullable event fields.

## Internationalization (i18n)

- `i18next` + `react-i18next` + browser language detector (`localStorage` `atlanta-passport-lang`). 9 locales: en, es, fr, pt, de, it, ja, ko, ar under `src/i18n/locales/*.json`.
- Init in `src/i18n/index.ts`; `applyDir()` strips region (`ar-SA`→`ar`) and sets `dir="rtl"`/`lang` on `<html>` for Arabic. Switcher: `<LanguageSwitcher variant="navbar"|"menu" />`.
- Regenerate via `scripts/translate-i18n.mjs <comma-list>` (AI Anthropic integration) — translate only NEW keys & merge; full-file regen times out (esp. Arabic). For tiny additions, a small node script is faster. Brand names preserved untranslated.
- Sample data (business names/descriptions/addresses/hours) is intentionally NOT translated.
- RTL: `rtl:rotate-180` on directional icons; `ltr:`/`rtl:` pairs where physical sides matter.

## User preferences

- **Site-structure / page naming convention.** The site is a fixed, curated set of pages — do NOT add new top-level pages without being asked. Canonical pages:
  - Passport (signed-in) — `/passport` = My Passport, `/passport/explore` = Explore, `/passport/routes` = Routes, `/passport/events` = Events, `/passport/stamps` = Stamps, `/passport/contact` = Contact.
  - Detail pages (one per selectable record) — `/listing/:id` = location, `/events/:id` = event, `/routes/:id` = route.
  - Marketing / public — `/` = Home, `/partners`, `/apply`; plus `/sign-in`, `/sign-up`, `/stamp/:slug`, `/admin/*`.
  - Removed and should stay removed: marketing About, marketing Contact, marketing Events-listing, Beltline Tour, and the Rewards page.
- When changing site structure, only delete/repurpose pages that were explicitly requested; do not alter unrelated graphics or functionality.

## Gotchas

- **Always pair `lg:`/`md:`/`sm:grid-cols-*` with an explicit base `grid-cols-1`.** A grid with no column class at the current breakpoint defaults to one `max-content` track, so a child with `max-w-*` blows the grid past the viewport on mobile (symptom: hero/CTA buttons sized as if the viewport were 672px+).
- **Wouter v3**: pass `className` directly on `<Link>`, never wrap a child `<a>` (nested-anchor hydration error).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
