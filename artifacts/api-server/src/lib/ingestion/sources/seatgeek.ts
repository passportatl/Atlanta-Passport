// SeatGeek Platform API adapter.
// Requires SEATGEEK_CLIENT_ID (free developer account); optional
// SEATGEEK_CLIENT_SECRET for higher rate limits.

import type { RawEvent } from "../normalizer";
import { logger } from "../../logger";
import {
  fetchJsonWithRetry,
  isMetroAtlanta,
  isNonEventListing,
  MissingCredentialError,
} from "./connector-utils";

export type SeatGeekConfig = {
  lat?: number;          // default Atlanta downtown
  lon?: number;
  range?: string;        // e.g. "30mi" (default)
  perPage?: number;      // default 100 (max 5000 total via pagination)
  maxPages?: number;     // default 3
  taxonomies?: string;   // comma-separated taxonomy slugs to include
  syncIntervalHours?: number;
};

type SgEvent = {
  id?: number;
  title?: string;
  short_title?: string;
  url?: string;
  datetime_local?: string;   // "2026-07-19T19:00:00"
  visible_until_utc?: string;
  type?: string;
  status?: string;
  venue?: {
    name?: string;
    address?: string;
    extended_address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    location?: { lat?: number; lon?: number };
  };
  performers?: Array<{ name?: string; image?: string }>;
  stats?: { lowest_price?: number | null; highest_price?: number | null };
  taxonomies?: Array<{ name?: string }>;
};

const CATEGORY_BY_TAXONOMY: Record<string, string> = {
  concert: "Music",
  music_festival: "Festivals",
  concerts: "Music",
  theater: "Arts & Culture",
  broadway_tickets_national: "Arts & Culture",
  comedy: "Comedy",
  family: "Family",
  sports: "Sports",
  nba: "Sports", nfl: "Sports", mlb: "Sports", nhl: "Sports", mls: "Sports",
  ncaa_football: "Sports", ncaa_basketball: "Sports", soccer: "Sports",
  dance_performance_tour: "Arts & Culture",
  classical: "Music", classical_opera: "Arts & Culture", classical_orchestral_instrumental: "Music",
};

function sgCategory(taxonomies?: SgEvent["taxonomies"], type?: string): string {
  for (const t of taxonomies ?? []) {
    const mapped = t.name ? CATEGORY_BY_TAXONOMY[t.name] : undefined;
    if (mapped) return mapped;
  }
  if (type && CATEGORY_BY_TAXONOMY[type]) return CATEGORY_BY_TAXONOMY[type]!;
  return "Entertainment";
}

export async function fetchSeatGeekEvents(config: SeatGeekConfig): Promise<RawEvent[]> {
  const clientId = process.env.SEATGEEK_CLIENT_ID;
  if (!clientId) throw new MissingCredentialError("SEATGEEK_CLIENT_ID", "SeatGeek");
  const clientSecret = process.env.SEATGEEK_CLIENT_SECRET;

  const perPage = Math.min(Math.max(config.perPage ?? 100, 1), 100);
  const maxPages = Math.min(Math.max(config.maxPages ?? 3, 1), 10);
  const lat = config.lat ?? 33.749;
  const lon = config.lon ?? -84.388;
  const range = config.range ?? "30mi";

  const all: SgEvent[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const params = new URLSearchParams({
      client_id: clientId,
      lat: String(lat),
      lon: String(lon),
      range,
      per_page: String(perPage),
      page: String(page),
      sort: "datetime_local.asc",
      "datetime_local.gte": new Date().toISOString().slice(0, 10),
    });
    if (clientSecret) params.set("client_secret", clientSecret);
    if (config.taxonomies) params.set("taxonomies.name", config.taxonomies);

    const data = await fetchJsonWithRetry<{ events?: SgEvent[]; meta?: { total?: number } }>(
      `https://api.seatgeek.com/2/events?${params.toString()}`,
      { provider: "SeatGeek" },
    );
    const events = data.events ?? [];
    all.push(...events);
    const total = data.meta?.total ?? 0;
    if (events.length < perPage || page * perPage >= total) break;
  }

  logger.info({ count: all.length }, "SeatGeek events fetched");

  const seen = new Set<number>();
  const results: RawEvent[] = [];

  for (const ev of all) {
    const title = ev.title ?? ev.short_title;
    if (!ev.id || !title) continue;
    if (seen.has(ev.id)) continue;
    seen.add(ev.id);

    if (isNonEventListing(title)) continue;

    const venue = ev.venue;
    if (
      !isMetroAtlanta({
        city: venue?.city,
        state: venue?.state,
        lat: venue?.location?.lat,
        lon: venue?.location?.lon,
      })
    ) {
      continue;
    }

    const dt = ev.datetime_local ?? "";
    const date = dt.slice(0, 10);
    if (!date) continue;
    const time = dt.length >= 16 ? dt.slice(11, 16) : undefined;

    let cost: string | undefined;
    const lo = ev.stats?.lowest_price;
    const hi = ev.stats?.highest_price;
    if (lo != null) cost = `From $${lo}${hi != null && hi !== lo ? ` – $${hi}` : ""}`;

    const address = [venue?.address, venue?.city, venue?.state, venue?.postal_code]
      .filter(Boolean)
      .join(", ");

    results.push({
      externalId: `sg-${ev.id}`,
      name: title,
      category: sgCategory(ev.taxonomies, ev.type),
      date,
      time,
      venue: venue?.name ?? "",
      address: address || undefined,
      neighborhood: venue?.city && venue.city !== "Atlanta" ? venue.city : undefined,
      cost,
      url: ev.url,
      imageUrl: ev.performers?.[0]?.image,
      organizer: ev.performers?.[0]?.name,
    });
  }

  logger.info({ usable: results.length, excluded: all.length - results.length }, "SeatGeek events after filtering");
  return results;
}
