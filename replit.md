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
- `artifacts/atlanta-passport/src/data/` — sample data (businesses, events, neighborhoods, packages, categories)
- `artifacts/atlanta-passport/src/index.css` — theme tokens / brand palette
- `artifacts/api-server/` — shared Express API server (currently only `/api/healthz`)
- `lib/api-spec/openapi.yaml` — API contract source of truth

## Architecture decisions

- Frontend-only marketing site — no backend wired up; sample data is static in `src/data/`.
- Apply form is local-state only (no submit endpoint); shows a thank-you state after submit.
- Routing via `wouter` with base path `import.meta.env.BASE_URL`.
- No FIFA branding anywhere — independent guide; disclaimer in footer.

## Product

Marketing site with: Home, Become a Partner (with $500 / $1,500 / $3,000+ packages), Explore (filterable by category & neighborhood), Business Listing template (Wheelhaus Bikes as showcase), Events, About, and Apply onboarding form.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
