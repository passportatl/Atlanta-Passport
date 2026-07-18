---
name: Google Sheets ingestion — sheet ID and adapter quirks
description: The MASTER CSV source sheet ID history, BOM issue, and header alias requirements for the Atlanta Passport events intake sheet.
---

## Correct events sheet ID

The active events sheet (patched 2026-07-18) is:
- `1zTXaiqFLGcUyeL_HlT3OjMN4dbh7HqHc71yDErZrrlo` — "Events CSV Summer 2026"
- Headers: `Event, Date, Time, Venue, Address, Photo, Link to site and/or social, Link to tickets, Ticket Price, Type, Area, Description, Featured, Passport Bonus Stamp`
- Drive CSV export exports the first tab only; this spreadsheet has events as its first tab.

## Wrong sheet (do not use as the events source)

`1Jn0Rc83OTgb4qiYhg2pvypD8e3QD8o-9QnP4zi0Hvj8` — its first tab is an operations dashboard with columns `Passport ATL Event Operations / Value / Purpose`. Pointing the google_sheets source at this ID causes 0 usable rows (all rejected silently or as errors).

**Why:** The Drive CSV export always exports the first tab. This spreadsheet has a stats dashboard as tab 1.

## BOM issue (now fixed in adapter)

Google Drive's CSV export prepends a UTF-8 BOM (`\uFEFF`) to the file. Without stripping it, the first header (e.g. `Event`) becomes `\uFEFFEvent`, which doesn't match the `"event"` alias and silently drops all rows (name column never maps → all rows filtered).

The adapter now strips BOM with `csvText.replace(/^\uFEFF/, "")`.

## Header normalization

The adapter normalizes headers by stripping non-alphanumeric characters (including `/`) before alias lookup:
- `"Link to site and/or social"` → `"link to site and or social"` → maps to `url`
- `"Link to tickets"` → `"link to tickets"` → maps to `url`
- `"Ticket Price"` → `"ticket price"` → maps to `cost`
- `"Area"` → `"area"` → maps to `neighborhood`

## Silent filtering removed

Old adapter: `.filter((ev) => !!ev.name)` silently dropped blank-name rows before runner saw them (no error counters incremented, no row-level reason logged).

New adapter: all rows passed to runner; blank-name rows become traceable `"Event name is blank after normalization"` errors in import_run_rows.

## Inspect endpoint

`GET /api/admin/sources/:id/inspect` returns raw headers, mapping, unmapped columns, total rows, usable rows, and 3 sample rows — safe read-only diagnostic, no DB writes.

## iCal feeds

No iCal feed URLs or venue names were ever proposed in this project's history (exhaustive search of transcript, memory, codebase, and DB confirmed zero results).
