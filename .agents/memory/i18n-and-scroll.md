---
name: Atlanta Passport i18n regen + framer useScroll
description: How to add new translation keys reliably, and how to avoid the framer-motion useScroll "non-static position" warning.
---

# Translating only NEW i18n keys (don't re-translate the whole file)

`scripts/translate-i18n.mjs` re-translates the ENTIRE `en.json` per locale. That payload is large and slow; running it for all 8 locales tends to exceed the bash tool's 120s cap, and detached `(node … &)` children get SIGKILLed when an outer bash command times out — leaving locale files unchanged with no error.

**Do this instead when you add a handful of keys:** translate only the new sub-objects and merge them into each locale's existing object.

**Why:** small payload → each request ~10–20s → all 8 run in parallel via `Promise.allSettled` inside ONE node process, finishing well under the cap, and the merge preserves every pre-existing key.

**How to apply:** write a throwaway node script that (1) picks the new sub-keys out of `en.json`'s `home` (e.g. `new_hero`, `pillars`, `decor`, …), (2) POSTs that small JSON to the Anthropic integration (`AI_INTEGRATIONS_ANTHROPIC_BASE_URL` + `_API_KEY`, model `claude-sonnet-4-6`) with the same "keep brand names untranslated" system prompt, (3) `cur.home = {...cur.home, ...translated}` and writes back. Run all 8 with `Promise.allSettled`. Delete the script after. Locales: es,fr,pt,de,it,ja,ko,ar. i18next plurals need `_one`/`_other` suffixes (e.g. `stops_count_one`).

# framer-motion useScroll warning

`useScroll({ target: ref, offset: [...] })` logs "Please ensure that the container has a non-static position…" even when the target IS `relative`, and the element-relative measurement can be inaccurate.

**Fix:** for a hero at the top of the page, use window scroll instead — `const { scrollY } = useScroll();` then `useTransform(scrollY, [0, 700], [...])`. No `target`/`ref` needed; the warning disappears and parallax is stable.
