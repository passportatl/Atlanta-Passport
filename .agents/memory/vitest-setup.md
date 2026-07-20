---
name: Vitest setup in this monorepo
description: How tests run in api-server and atlanta-passport, and the PORT pitfall
---
- api-server and atlanta-passport each have `pnpm test` (vitest run); no root-level test runner.
- atlanta-passport needs its standalone `vitest.config.ts` (with the `@` alias) because `vite.config.ts` throws when PORT is unset — vitest must not load the vite config.
- api-server route tests are integration tests: they mount the route's Router in a bare express app (stub `req.log`), hit it with supertest, and run against the real dev DB via DATABASE_URL/ADMIN_SECRET. Insert prefixed test rows and delete them (plus their eventAuditLog rows) in afterAll.
