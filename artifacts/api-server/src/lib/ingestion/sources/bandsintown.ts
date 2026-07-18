// Bandsintown Public API adapter.
// Requires BANDSINTOWN_APP_ID (Bandsintown grants app IDs to approved apps).
//
// The public API is artist-centric: configure a list of artists to track and
// the adapter pulls each artist's upcoming events, keeping only Atlanta-metro
// dates.

import type { RawEvent } from "../normalizer";
import { logger } from "../../logger";
import {
  fetchJsonWithRetry,
  isMetroAtlanta,
  MissingCredentialError,
} from "./connector-utils";

export type BandsintownConfig = {
  artists?: string[];       // artist names to track
  defaultCategory?: string; // default "Music"
  syncIntervalHours?: number;
};

type BitEvent = {
  id?: string;
  url?: string;
  datetime?: string; // "2026-07-19T19:00:00"
  title?: string;
  artist?: { name?: string; image_url?: string };
  venue?: {
    name?: string;
    city?: string;
    region?: string;
    country?: string;
    latitude?: string;
    longitude?: string;
    street_address?: string;
    postal_code?: string;
  };
  offers?: Array<{ type?: string; url?: string; status?: string }>;
};

export async function fetchBandsintownEvents(config: BandsintownConfig): Promise<RawEvent[]> {
  const appId = process.env.BANDSINTOWN_APP_ID;
  if (!appId) throw new MissingCredentialError("BANDSINTOWN_APP_ID", "Bandsintown");

  const artists = (config.artists ?? []).filter(Boolean);
  if (artists.length === 0) {
    throw new Error(
      "Bandsintown source needs at least one artist in its config " +
        "(the public API is artist-centric — list artists to track)",
    );
  }

  const results: RawEvent[] = [];
  const seen = new Set<string>();
  let fetched = 0;

  for (const artist of artists) {
    let events: BitEvent[] = [];
    try {
      events = await fetchJsonWithRetry<BitEvent[]>(
        `https://rest.bandsintown.com/artists/${encodeURIComponent(artist)}/events?app_id=${encodeURIComponent(appId)}&date=upcoming`,
        { provider: "Bandsintown" },
      );
    } catch (err) {
      // A single unknown artist should not fail the whole sync.
      logger.warn({ artist, err }, "Bandsintown artist fetch failed — skipping artist");
      continue;
    }
    if (!Array.isArray(events)) continue;
    fetched += events.length;

    for (const ev of events) {
      if (!ev.id || seen.has(ev.id)) continue;
      seen.add(ev.id);

      const venue = ev.venue;
      const lat = venue?.latitude ? Number(venue.latitude) : undefined;
      const lon = venue?.longitude ? Number(venue.longitude) : undefined;
      if (venue?.country && !/united states/i.test(venue.country)) continue;
      if (!isMetroAtlanta({ city: venue?.city, state: venue?.region, lat, lon })) continue;

      const dt = ev.datetime ?? "";
      const date = dt.slice(0, 10);
      if (!date) continue;
      const time = dt.length >= 16 ? dt.slice(11, 16) : undefined;

      const artistName = ev.artist?.name ?? artist;
      const address = [venue?.street_address, venue?.city, venue?.region, venue?.postal_code]
        .filter(Boolean)
        .join(", ");
      const ticketUrl = ev.offers?.find((o) => o.type === "Tickets" && o.status === "available")?.url;

      results.push({
        externalId: `bit-${ev.id}`,
        name: ev.title?.trim() || `${artistName} at ${venue?.name ?? "Atlanta"}`,
        category: config.defaultCategory ?? "Music",
        date,
        time,
        venue: venue?.name ?? "",
        address: address || undefined,
        neighborhood: venue?.city && venue.city !== "Atlanta" ? venue.city : undefined,
        url: ticketUrl ?? ev.url,
        imageUrl: ev.artist?.image_url,
        organizer: artistName,
      });
    }
  }

  logger.info({ fetched, usable: results.length }, "Bandsintown events after filtering");
  return results;
}
