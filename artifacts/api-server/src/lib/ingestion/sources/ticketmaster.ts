// Ticketmaster Discovery API adapter.
// Safe no-op when TICKETMASTER_API_KEY is not set.

import type { RawEvent } from "../normalizer";
import { logger } from "../../logger";

export type TicketmasterConfig = {
  keyword?: string;
  city?: string;
  stateCode?: string;
  radius?: string;        // miles, default "25"
  classificationName?: string; // e.g. "Music", "Sports"
  size?: string;          // results per page, default "50"
};

type TmEvent = {
  id?: string;
  name?: string;
  url?: string;
  dates?: {
    start?: { localDate?: string; localTime?: string };
    status?: { code?: string };
  };
  classifications?: Array<{ segment?: { name?: string }; genre?: { name?: string } }>;
  _embedded?: {
    venues?: Array<{
      name?: string;
      address?: { line1?: string };
      city?: { name?: string };
      state?: { stateCode?: string };
    }>;
  };
  priceRanges?: Array<{ min?: number; max?: number; currency?: string }>;
  info?: string;
  pleaseNote?: string;
  description?: string;
};

export async function fetchTicketmasterEvents(config: TicketmasterConfig): Promise<RawEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    logger.warn("TICKETMASTER_API_KEY not set — skipping Ticketmaster sync");
    return [];
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    city: config.city ?? "Atlanta",
    stateCode: config.stateCode ?? "GA",
    radius: config.radius ?? "25",
    unit: "miles",
    size: config.size ?? "50",
    sort: "date,asc",
  });
  if (config.keyword) params.set("keyword", config.keyword);
  if (config.classificationName) params.set("classificationName", config.classificationName);

  const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;

  let data: { _embedded?: { events?: TmEvent[] }; page?: { totalElements?: number } };
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      throw new Error(`Ticketmaster API ${res.status}: ${await res.text()}`);
    }
    data = (await res.json()) as typeof data;
  } catch (err) {
    throw new Error(`Ticketmaster fetch failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const tmEvents = data._embedded?.events ?? [];
  logger.info({ count: tmEvents.length }, "Ticketmaster events fetched");

  return tmEvents.map((ev): RawEvent => {
    const venue = ev._embedded?.venues?.[0];
    const venueName = venue?.name ?? "";
    const venueCity = venue?.city?.name ?? "";
    const venueState = venue?.state?.stateCode ?? "";
    const venueAddr = venue?.address?.line1 ?? "";
    const fullAddress = [venueAddr, venueCity, venueState].filter(Boolean).join(", ");

    const classification = ev.classifications?.[0];
    const category = classification?.genre?.name ?? classification?.segment?.name ?? "Entertainment";

    const priceRange = ev.priceRanges?.[0];
    let cost: string | undefined;
    if (priceRange) {
      if (priceRange.min === 0 && priceRange.max === 0) cost = "Free";
      else if (priceRange.min != null)
        cost = `From $${priceRange.min}${priceRange.max ? ` – $${priceRange.max}` : ""}`;
    }

    const desc = [ev.info, ev.pleaseNote, ev.description].filter(Boolean).join(" ").trim();

    const status = ev.dates?.status?.code;
    const isCancelled = status === "cancelled" || status === "canceled" || status === "postponed";

    return {
      externalId: ev.id,
      name: isCancelled ? `[${status?.toUpperCase()}] ${ev.name ?? ""}` : (ev.name ?? ""),
      category,
      date: ev.dates?.start?.localDate ?? "",
      time: ev.dates?.start?.localTime ?? undefined,
      venue: venueName,
      address: fullAddress || undefined,
      neighborhood: venueCity !== "Atlanta" ? venueCity : undefined,
      description: desc || undefined,
      cost,
      url: ev.url,
    };
  });
}
