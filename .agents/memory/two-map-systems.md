---
name: Two map/marker systems
description: Atlanta Passport has TWO independent maps with different marker mechanisms — change the right one.
---

# Two independent maps — pick the right one for marker changes

There are two distinct maps, each with its own marker code. A request like "change X's
icon on the map" is ambiguous — confirm which surface before editing.

1. **Interactive Explore map** — `components/BusinessMap.tsx`, used on the signed-in
   `/passport/explore|routes|events|stamps` views (auth-gated; the screenshot/testing
   tools can't reach it without a Clerk session). Markers are `@vis.gl/react-google-maps`
   legacy `google.maps.Marker` with a JS `icon` object (ballIcon = imported PNG url +
   `coreLib.Size/Point`). No `mapId` is set, so legacy custom `icon` works fine.

2. **Static location snapshot** — `components/MapSnapshot.tsx`, used on the PUBLIC
   `/listing/:id` and `/events/:id` detail pages. It's a Google **Static Maps API** `<img>`
   centered on `lat,lng` (zoom 16). Default marker is a maroon pin (`markers=color:0xa71930`).

**Why:** "Make the Trap Museum's map icon a soccer ball" was about #2 (the listing-page
snapshot), not #1. The Explore map already balled offer-spots, so editing #1 had zero
visible effect for the user.

**How to apply:** For a soccer-ball (stamp) marker on the static snapshot, do NOT use a
Static Maps custom-icon URL — Google's servers fetch the icon, and the dev Vite asset URL
isn't publicly reachable (would silently fail in dev). Instead omit the `markers=` param
and overlay a centered `<img>` (`absolute left-1/2 top-1/2 -translate-1/2`) — the static
map is always centered on the spot, so dead-center == the marker. Works in dev AND prod.
`MapSnapshot` takes `isStamp`; listing.tsx passes `Boolean(STAMP_SLUG[business.id])`.

**Harness note:** hard-navigating to `/listing/:id` via the screenshot/testing tools falls
back to the home page (proxy/SPA deep-link quirk). Real users reach listings via in-app
clicks (Explore/Routes/Stamps/map → `/listing/${id}`). Verify detail-page UI by reasoning
+ typecheck, not by deep-link screenshots.
