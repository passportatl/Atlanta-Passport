---
name: OpenAPI spec drift vs generated clients
description: Generated api-zod/api-client-react files had fields not present in openapi.yaml; regen clobbers them.
---

The generated files in `lib/api-zod/src/generated/` and `lib/api-client-react/src/generated/` were at some point ahead of `lib/api-spec/openapi.yaml` (fields like imageUrl, ticketUrl, listingPackage, addOns, listingPrice, tags, ageCategory, highlights, instagram, contact* existed only in generated output).

**Why:** running `pnpm --filter @workspace/api-spec run codegen` regenerates strictly from the yaml — any field missing from the spec silently disappears from the clients and breaks typecheck across artifacts.

**How to apply:** before regenerating, diff the generated files after codegen (`git diff lib/`) and if fields vanished, add them to the matching schema in `openapi.yaml` (EventRecord, AdminEventRecord, SubmitEventInput, AdminUpdateEventInput) rather than hand-editing generated files. As of July 2026 the spec has been reconciled; keep it that way by editing the spec first.
