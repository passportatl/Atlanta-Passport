---
name: RSS/structured feed integration
description: Which Atlanta feed families work for event ingestion and how the RSS adapter picks event dates
---

## Feed families that work (rss/json_api adapters)
- **carbonhouse venues** (`/events/rss`): Gas South, Cobb Energy, Fox Theatre, State Farm Arena — real event dates in `ev:startdate`/`dc:date`, venue in `ev:location`. No fieldMap needed.
- **The Events Calendar (tribe) JSON** (`wp-json/tribe/events/v1/events`): Buckhead Village, The Battery — use json_api with dot-path fieldMap (title/start_date/venue.venue/venue.address/image.url/global_id).
- **bibliocommons library RSS** (fulcolibrary): dates ONLY in `bc:start_date(_local)`, venue in `bc:name` — REQUIRES fieldMap `{date, venue, address}`; feed is huge, set `maxItems`.

## RSS adapter date rule
The adapter tries date candidates in priority order (fieldMap.date > ev:startdate > bc:start_date > xCal:dtstart > pubDate/published/updated/dc:date) and uses the **first that parses** — never pick first-present-then-parse, or an unparsable extension tag silently drops valid items.
**Why:** many feeds carry both a bogus/odd-format event tag and a valid pubDate.

## Rejected source patterns (don't retry blindly)
- Discover Atlanta & City of Decatur: 403 bot-block. CivicPlus city RSS = news, not events. Museum/attraction feeds (MODA, Fernbank, High, Zoo, Puppetry, Alliance, Atlantic Station) = blog/pubDate-only. Localist campuses (GT/Emory/KSU) not accessible. LibNet (Gwinnett/DeKalb) JSON returns [].
- Venues already covered by an iCal source (PCM, AHC, Callanwolde, GSU) — do NOT also add their tribe JSON; duplicate-source churn.
