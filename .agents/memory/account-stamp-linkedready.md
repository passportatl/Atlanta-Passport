---
name: Account-based stamp collection & the linkedReady gate
description: Why account-scoped stamp/collect flows must gate on a "linking confirmed" flag, not just isSignedIn + visitorId.
---

# Account-based stamp collection: gate on `linkedReady`, not just `isSignedIn` + `visitorId`

When a Clerk-authenticated user collects something keyed to a backend `visitorId`,
there is a window where the user is signed in but the localStorage `visitorId`
still points at the **previous/anonymous** visitor — the Clerk→visitor link
(`POST /api/visitors/link`) hasn't resolved yet. Collecting during that window
writes into the wrong (anonymous) passport.

**Rule:** introduce a `linkedReady` boolean on the visitor context. It starts
`false` on every mount, the bridge sets it `false` on sign-out/account-switch and
at the start of any unconfirmed sign-in, and sets it `true` ONLY after the link
call resolves and `setVisitorId(linkedId)` has run. Any auto-collect / redirect
effect must require `isSignedIn && linkedReady && visitorId`.

**Why:** two architect reviews failed on this exact stale-visitorId race; gating
only on `isSignedIn && visitorId` is insufficient because the stale id is briefly
truthy. The flag approach was chosen over comparing `clerkUserId` because
`clerkUserId` is not in the OpenAPI Visitor schema (avoids a contract/codegen
change).

**How to apply:** whenever a React effect reads `linkedReady` (or any such
async-confirmation flag) in its body, it MUST be in the dependency array — a
returning user often keeps the SAME `visitorId` in localStorage while `linkedReady`
flips `false→true`, so an effect keyed only on `visitorId` will never re-run and the
post-auth redirect/collect silently never fires. Also clear any "pending action"
localStorage key in BOTH the success and the catch path, or a hard failure traps
the user in a redirect loop.
