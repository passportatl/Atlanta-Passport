---
name: OpenAPI spec drift vs generated clients
description: Generated api-zod/api-client-react files had fields not present in openapi.yaml; regen clobbers them.
---

The generated files in `lib/api-zod/src/generated/` and `lib/api-client-react/src/generated/` were at some point ahead of `lib/api-spec/openapi.yaml` (fields like imageUrl, ticketUrl, listingPackage, addOns, listingPrice, tags, ageCategory, highlights, instagram, contact* existed only in generated output).

**Why:** running `pnpm --filter @workspace/api-spec run codegen` regenerates strictly from the yaml — any field missing from the spec silently disappears from the clients and breaks typecheck across artifacts.

**How to apply:** before regenerating, diff the generated files after codegen (`git diff lib/`) and if fields vanished, add them to the matching schema in `openapi.yaml` (EventRecord, AdminEventRecord, SubmitEventInput, AdminUpdateEventInput) rather than hand-editing generated files. As of July 2026 the spec has been reconciled; keep it that way by editing the spec first.
---
name: OpenAPI spec vs generated clients drift
description: lib/api-spec/openapi.yaml can lag the committed generated clients; running codegen then silently drops fields
---
The committed generated clients (lib/api-zod, lib/api-client-react) have at times been ahead of `lib/api-spec/openapi.yaml` (fields present in generated code but missing from the spec — e.g. SubmitEventInput tags/imageUrl/listingPackage, AdminUpdateEventInput contact fields).

**Why:** running `pnpm --filter @workspace/api-spec run codegen` regenerates from the spec, so any spec gap silently deletes fields from the clients and breaks server/frontend typechecks far from your change.

**How to apply:** after codegen, always `git diff` the generated files; if fields *disappear* that you didn't remove, restore them in openapi.yaml (schemas near the bottom) and regenerate rather than accepting the deletion. Fixed for events schemas July 2026, but check any other schema you touch.
