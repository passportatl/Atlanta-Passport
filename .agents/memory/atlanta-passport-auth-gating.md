---
name: Atlanta Passport route gating & screenshots
description: Why app-preview screenshots of most Atlanta Passport pages show the home hero instead of the page.
---

Atlanta Passport gates nearly every route behind a Clerk account. `isProtectedRoute` in `App.tsx` allow-lists only a few public routes (`/`, `/partners`, `/apply`, `/passport/contact`, plus `/sign-in`, `/sign-up`, `/stamp/`, `/admin/`). Everything else — including detail pages like `/listing/:id`, `/events/:id`, `/routes/:id` and all `/passport/*` — is protected.

`ProtectedRouteRedirect` sends a signed-out visitor hitting a protected route to `/` (home) on initial load (or `/sign-up` for in-session navigation).

**Why this matters:** the `app_preview` screenshot tool loads as a *signed-out* visitor, so deep-linking it to a protected page (e.g. `/listing/atlantucky-brewing`) redirects to home and the capture shows the home hero ("The Unofficial Field Guide to the Real Atlanta") — NOT a bug in the page. To screenshot/verify a gated page, either screenshot a public route, or sign in first. `ALLOW_PUBLIC_ACCESS = false` in `App.tsx` is the master switch (flip to true temporarily only for local design work).
