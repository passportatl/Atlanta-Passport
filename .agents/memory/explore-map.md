---
name: Explore page interactive map
description: Why the Explore page uses a native Google Map while home/beltline use an iframe embed
---

# Explore map: native vs external embed

The Explore page (`/explore`) "show on map" interaction uses a **native** Google Map
(`@vis.gl/react-google-maps`) so result-card clicks can pan/zoom to a business.

**Why:** The external embed app (`map-explorer-passportATL.replit.app`, used via
`InteractiveMap.tsx` on home + beltline) exposes **no deep-link param and no postMessage
hook**, so the parent cannot drive it. Controlling the map from clicks requires our own map.

**How to apply:**
- Home Featured Experience + Beltline hero intentionally keep the external iframe embed — leave as-is.
- The native map reads a browser key from `import.meta.env.VITE_GOOGLE_MAPS_API_KEY` (must be `VITE_`-prefixed; restart the web workflow after the secret changes). It renders a fallback message if the key is missing.
- Uses classic `Marker` (deprecated but works without a Cloud `mapId`); `AdvancedMarker` would need a `mapId`.
- Card "show on map" must stay keyboard-operable (role=button + tabIndex + Enter/Space); the nested "View details" link uses `stopPropagation`. Clear `selectedBizId` when filters remove that business.
- **Custom marker icons must not construct `google.maps.Size`/`Point` at module scope or in the first render** — markers mount before the JS API loads, so the global `google` is undefined and the map crashes with "google is not defined". Build icon objects inside a child component gated on `useMapsLibrary("core")` (use `coreLib.Size`/`coreLib.Point`); it returns null until loaded, then re-renders. A plain data-URI string icon is always safe; only the `Size`/`Point` constructors need the guard.
