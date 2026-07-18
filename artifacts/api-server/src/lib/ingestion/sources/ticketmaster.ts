// Ticketmaster Discovery API adapter.
// Throws when TICKETMASTER_API_KEY is missing or the API rejects the request,
// so sync runs surface an error instead of silently reporting "0 found".

import type { RawEvent } from "../normalizer";
import { logger } from "../../logger";

export type TicketmasterConfig = {
  keyword?: string;
  city?: string;
  stateCode?: string;
  radius?: string;        // miles, default "30"
  dmaId?: string;         // e.g. "220" = Atlanta DMA (overrides city/radius when set)
  classificationName?: string; // e.g. "Music", "Sports"
  size?: string;          // results per page, default "100" (TM max 200)
  maxPages?: number;      // pagination cap, default 3
  syncIntervalHours?: number;
};

type TmEvent = {
  id?: string;
  name?: string;
  url?: string;
  type?: string;
  dates?: {
    start?: { localDate?: string; localTime?: string; dateTime?: string };
    timezone?: string;
    status?: { code?: string };
  };
  sales?: { public?: { startDateTime?: string; endDateTime?: string } };
  classifications?: Array<{
    segment?: { name?: string };
    genre?: { name?: string };
    subGenre?: { name?: string };
  }>;
  images?: Array<{ url?: string; width?: number; height?: number; ratio?: string }>;
  ageRestrictions?: { legalAgeEnforced?: boolean };
  promoter?: { name?: string };
  _embedded?: {
    venues?: Array<{
      name?: string;
      address?: { line1?: string };
      city?: { name?: string };
      state?: { stateCode?: string };
      postalCode?: string;
    }>;
  };
  priceRanges?: Array<{ min?: number; max?: number; currency?: string }>;
  info?: string;
  pleaseNote?: string;
  description?: string;
};

// Listings that are add-ons rather than primary events.
const EXCLUDE_NAME = /\b(parking|park & ride|shuttle|vip (package|upgrade|add[- ]?on)|upgrade only|merchandise|meet (and|&) greet only|camping pass|tailgate)\b/i;

function pickImage(images?: TmEvent["images"]): string | undefined {
  if (!images?.length) return undefined;
  const sorted = [...images]
    .filter((i) => i.url)
    .sort((a, b) => {
      const aScore = (a.ratio === "16_9" ? 10000 : 0) + (a.width ?? 0);
      const bScore = (b.ratio === "16_9" ? 10000 : 0) + (b.width ?? 0);
      return bScore - aScore;
    });
  return sorted[0]?.url;
}

// Pull a short human-readable reason out of a Ticketmaster error body.
// Ticketmaster returns either { fault: { faultstring } } (apigee auth errors)
// or { errors: [{ detail }] } (Discovery API errors). Falls back to a trimmed
// snippet of the raw body so the admin still sees *something* useful.
function describeTmError(status: number, body: string): string {
  let reason: string | undefined;
  try {
    const parsed = JSON.parse(body) as {
      fault?: { faultstring?: string };
      errors?: Array<{ detail?: string; code?: string }>;
    };
    reason = parsed.fault?.faultstring ?? parsed.errors?.[0]?.detail ?? parsed.errors?.[0]?.code;
  } catch {
    // Not JSON — use a snippet of the raw body below.
  }
  if (!reason) {
    const snippet = body.replace(/\s+/g, " ").trim().slice(0, 200);
    reason = snippet || undefined;
  }
  if (status === 401 || status === 403) {
    reason = reason
      ? `${reason} — check that TICKETMASTER_API_KEY is valid`
      : "check that TICKETMASTER_API_KEY is valid";
  } else if (status === 429) {
    reason = reason ? `${reason} — rate limited, try again later` : "rate limited, try again later";
  }
  return reason ? `: ${reason}` : "";
}

export async function fetchTicketmasterEvents(config: TicketmasterConfig): Promise<RawEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "TICKETMASTER_API_KEY is not set — add the API key before syncing this source",
    );
  }

  const sizeNum = Math.min(Math.max(Number(config.size) || 100, 1), 200);
  const size = String(sizeNum);
  const maxPagesNum = Number(config.maxPages);
  const maxPages = Math.min(Math.max(Number.isFinite(maxPagesNum) && maxPagesNum > 0 ? Math.floor(maxPagesNum) : 3, 1), 10);
  const now = new Date();
  const startDateTime = now.toISOString().replace(/\.\d{3}Z$/, "Z");

  const all: TmEvent[] = [];
  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      apikey: apiKey,
      size,
      page: String(page),
      sort: "date,asc",
      startDateTime,
    });
    if (config.dmaId) {
      params.set("dmaId", config.dmaId);
    } else {
      params.set("city", config.city ?? "Atlanta");
      params.set("stateCode", config.stateCode ?? "GA");
      params.set("radius", config.radius ?? "30");
      params.set("unit", "miles");
    }
    if (config.keyword) params.set("keyword", config.keyword);
    if (config.classificationName) params.set("classificationName", config.classificationName);

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;

    let data: { _embedded?: { events?: TmEvent[] }; page?: { totalPages?: number; totalElements?: number } };
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `Ticketmaster API rejected the request (HTTP ${res.status} ${res.statusText})` +
            `${describeTmError(res.status, body)}`,
        );
      }
      data = (await res.json()) as typeof data;
    } catch (err) {
      throw new Error(`Ticketmaster fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    const events = data._embedded?.events ?? [];
    all.push(...events);
    const totalPages = data.page?.totalPages ?? 1;
    if (page + 1 >= totalPages || events.length === 0) break;
  }

  logger.info({ count: all.length }, "Ticketmaster events fetched");

  const seen = new Set<string>();
  const results: RawEvent[] = [];

  for (const ev of all) {
    if (!ev.id || !ev.name) continue;
    if (seen.has(ev.id)) continue;
    seen.add(ev.id);

    // Exclusions: cancelled, add-on/parking listings
    const status = ev.dates?.status?.code?.toLowerCase();
    if (status === "cancelled" || status === "canceled") continue;
    if (EXCLUDE_NAME.test(ev.name)) continue;

    const venue = ev._embedded?.venues?.[0];
    const venueState = venue?.state?.stateCode ?? "";
    // Metro guard: only Georgia venues. When state metadata is missing but a
    // venue is present, drop the record rather than admit out-of-area events.
    if (venue && venueState !== "GA") continue;

    const venueName = venue?.name ?? "";
    const venueCity = venue?.city?.name ?? "";
    const venueAddr = venue?.address?.line1 ?? "";
    const fullAddress = [venueAddr, venueCity, venueState, venue?.postalCode].filter(Boolean).join(", ");

    const classification = ev.classifications?.[0];
    const category = classification?.genre?.name ?? classification?.segment?.name ?? "Entertainment";

    const priceRange = ev.priceRanges?.[0];
    let cost: string | undefined;
    if (priceRange) {
      if (priceRange.min === 0 && priceRange.max === 0) cost = "Free";
      else if (priceRange.min != null)
        cost = `From $${priceRange.min}${priceRange.max ? ` – $${priceRange.max}` : ""}`;
    }

    const descParts = [ev.info, ev.pleaseNote, ev.description].filter(Boolean);
    if (ev.ageRestrictions?.legalAgeEnforced) descParts.push("Age restriction: 18+/21+ enforced.");
    if (status === "postponed" || status === "rescheduled") descParts.push(`Note: this event has been ${status}.`);
    const desc = descParts.join(" ").trim();

    results.push({
      externalId: ev.id,
      name: ev.name,
      category,
      date: ev.dates?.start?.localDate ?? "",
      time: ev.dates?.start?.localTime ?? undefined,
      venue: venueName,
      address: fullAddress || undefined,
      neighborhood: venueCity && venueCity !== "Atlanta" ? venueCity : undefined,
      description: desc || undefined,
      cost,
      url: ev.url,
      imageUrl: pickImage(ev.images),
      organizer: ev.promoter?.name,
    });
  }

  logger.info({ usable: results.length, excluded: all.length - results.length }, "Ticketmaster events after filtering");
  return results;
}
