---
name: OpenAPI spec vs generated clients drift
description: lib/api-spec/openapi.yaml can lag the committed generated clients; running codegen then silently drops fields
---
The committed generated clients (lib/api-zod, lib/api-client-react) have at times been ahead of `lib/api-spec/openapi.yaml` (fields present in generated code but missing from the spec — e.g. SubmitEventInput tags/imageUrl/listingPackage, AdminUpdateEventInput contact fields).

**Why:** running `pnpm --filter @workspace/api-spec run codegen` regenerates from the spec, so any spec gap silently deletes fields from the clients and breaks server/frontend typechecks far from your change.

**How to apply:** after codegen, always `git diff` the generated files; if fields *disappear* that you didn't remove, restore them in openapi.yaml (schemas near the bottom) and regenerate rather than accepting the deletion. Fixed for events schemas July 2026, but check any other schema you touch.
