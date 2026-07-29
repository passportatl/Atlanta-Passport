---
name: LocationContent rich partner pages
description: Pattern for adding sponsor-specific rich content to listing pages without touching the Business type or sample-data.ts structure.
---

## The pattern

All sponsor-specific rich content lives in `locationBranding.ts` under an optional `locationContent?: LocationContent` field on `LocationBranding`. The `Business` type (inferred from `businessesRaw`) is never touched.

`LocationContent` fields are all individually optional:
- `gallery` — imported Vite asset images for a photo strip
- `instagramHandles` — badge links to IG profiles
- `contactPhone` / `contactEmail` — omit until confirmed from onboarding sheet
- `admissionPricing` — pricing tiers; omit if not confirmed
- `parkingNote` — injected into Getting Here section alongside MARTA/Beltline badges
- `accessibilityNote` — ADA info shown above policy list
- `policies` — array of `{ label, body }` for age/photo/smoking rules
- `featuredExperiences` — "What To Expect" list with accent bar
- `tempEvents` — placeholder calendar entries while final event details are pending

## Rendering in listing.tsx

Each content block is individually gated: `lc?.gallery && lc.gallery.length > 0` etc. Absent sub-fields render nothing — no empty sections appear.

`tempEvents` are passed as a prop to `LocationEventCalendar` (which must have `showEventCalendar: true` and `venueNames` set). They render with a dashed outlined date badge + "Details TBD" chip, clearly distinct from live DB events. Sorted by ISO date and filtered to the Passport period automatically.

## Gallery images

Must be imported at the top of `locationBranding.ts` as Vite assets (not URLs), same as `sample-data.ts` imports its images. Add the `import` alongside the existing location's import block.

**Why:** Keeps Business type stable across all 70+ locations; prevents accidental rendering of empty/stub sections for unonfigured partners; makes it safe to add rich content incrementally as onboarding data is confirmed field by field.

**How to apply:** When a new sponsored partner needs a rich page, add a `locationContent` block to their entry in `LOCATION_BRANDING` with only the confirmed fields. listing.tsx renders whatever is present; omit rather than fabricate unconfirmed data.

**Per-location color themes:** optional `theme` object on LocationBranding injects scoped CSS vars in listing.tsx (page container only). Shared components (MediaGallery, StampChecklist) use `var(--surface-card, #ffffff)`-style fallbacks so non-themed pages stay byte-identical — never swap their hardcoded whites for global tokens like bg-background (cream, not white).
