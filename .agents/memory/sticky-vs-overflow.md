---
name: Sticky header vs overflow-x clipping
description: Why position:sticky silently fails in this repo and the correct fix
---

# Sticky positioning + horizontal-overflow clipping

`position: sticky` silently stops working when an ancestor uses `overflow-x: hidden`
(or any non-visible `overflow`), because that ancestor becomes a scroll container and
the sticky element sticks to it instead of the viewport.

**Rule:** for full-page mobile horizontal-scroll safety, clip with `overflow-x: clip`,
never `overflow-x: hidden`, on `html`/`body`/`#root` (or any wrapper that contains a
sticky header).

**Why:** `clip` visually clips overflow just like `hidden` but does NOT establish a
scroll container, so descendant `position: sticky` keeps sticking to the viewport.

**How to apply:** in `artifacts/atlanta-passport/src/index.css` the `html, body` and
`#root` blocks must keep `overflow-x: clip`. If a sticky element (e.g. the navbar
header) ever stops pinning, check whether an ancestor reintroduced `overflow-x: hidden`.
