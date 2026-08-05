---
name: Pricing single source of truth
description: All listing package/add-on prices live in lib/pricing; ids must mirror the live public forms.
---
The workspace lib `@workspace/pricing` (`lib/pricing/src/index.ts`) is the ONLY authoritative price list for business, event, location, and vendor submissions. All intake routes (`/applications`, `/events`, `/location-submissions`) recompute totals server-side with `computeQuote` and ignore client prices.

**Why:** clients previously sent their own `listingPrice`, and the frontend had multiple hardcoded price lists that drifted.

**How to apply:**
- Package/add-on ids in the lib MUST mirror the ids used by the live public forms: events use free/basic($149)/featured($399)/premier($649)/signature($999) with add-ons newsletter/instagram_feature/sponsored_route/homepage_spotlight; locations use free/starter($199)/growth($499)/premier($999). Changing an id breaks intake validation on the corresponding form.
- Frontend forms must validate package ids against `PACKAGES[kind]` from the lib (no hardcoded enums).
- `PATCH /visitors/:id/preferences` (promo consent) enforces ownership: Clerk-linked visitors require the matching signed-in user; anonymous visitors are open (same posture as other visitor routes).
