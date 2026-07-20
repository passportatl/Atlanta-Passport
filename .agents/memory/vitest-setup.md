---
name: Vitest setup in this monorepo
description: How tests run in api-server and atlanta-passport, and the PORT pitfall
---
- api-server and atlanta-passport each have `pnpm test` (vitest run); no root-level test runner.
- atlanta-passport needs its standalone `vitest.config.ts` (with the `@` alias) because `vite.config.ts` throws when PORT is unset — vitest must not load the vite config.
- Component (TSX) tests in atlanta-passport: vitest.config needs `esbuild: { jsx: "automatic" }` (else "React is not defined" from transitively imported components) and `*.test.tsx` in include; keep env node globally and opt into jsdom per-file via `// @vitest-environment jsdom`. @testing-library/react + jsdom are installed; stub global fetch with a route-based mock for admin panels.
- api-server route tests are integration tests: they mount the route's Router in a bare express app (stub `req.log`), hit it with supertest, and run against the real dev DB via DATABASE_URL/ADMIN_SECRET. Insert prefixed test rows and delete them (plus their eventAuditLog rows) in afterAll.
