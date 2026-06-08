---
name: i18n translation regeneration limits
description: How to regenerate atlanta-passport locales without hitting the bash tool timeout
---

# Regenerating atlanta-passport i18n locales

Script: `scripts/translate-i18n.mjs <comma-list>` (repo root, NOT `artifacts/atlanta-passport/scripts/`). Reads `artifacts/atlanta-passport/src/i18n/locales/en.json`, translates the WHOLE file per language via the Anthropic AI integration, writes `<code>.json`. 8 target langs: es,fr,pt,de,it,ja,ko,ar.

## Timeout reality
**Why:** one full-file translation takes ~90s; the largest locale (Arabic/MSA) reliably exceeds the 120s bash-tool cap. Running all 8 serially, or even Arabic alone, times out.

**How to apply:**
- Run the other locales in parallel inside ONE foreground bash call with `... & ... & wait` — most finish under the cap.
- Background tricks (`nohup … &`, `setsid …`) do NOT survive: the tool kills the process group when the call returns, so files never get written.
- For a single slow/large locale OR when you only added a few keys: do NOT re-translate the whole file. Translate just the new key subset (small payload, fast) and deep-merge it into the existing `<code>.json`. This is the robust path for Arabic.

## Validate after
Check every locale parses and has the new keys, e.g. `node -e "const o=require('./<code>.json'); console.log(!!o.home?.<newkey>)"`.

## Catch missing keys before the user does
Audit `t("…")` usage against en.json: regex `t\(\s*["`]([\w.]+)["`]` over the page, resolve each dotted key in en.json, report misses. A `t("home.events.view_event")` that exists only as `events_page.view_event` silently renders the raw key string.
