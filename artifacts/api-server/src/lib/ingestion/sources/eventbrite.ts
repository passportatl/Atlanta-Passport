// Eventbrite API adapter.
// Requires EVENTBRITE_API_TOKEN (private OAuth token from an Eventbrite
// developer account).
//
// Note: Eventbrite retired its public event *search* endpoint in 2020, so
// discovery is organization-based: configure one or more organizationIds to
// pull their public events. Venue geo data is still validated against the
// Atlanta metro area.

import type { RawEvent } from "../normalizer";
import { logger } from "../../logger";
import {
  fetchJsonWithRetry,
  isMetroAtlanta,
  isNonEventListing,
  MissingCredentialError,
} from "./connector-utils";

export type EventbriteConfig = {
  organizationIds?: string[]; // Eventbrite organization IDs to pull events from
  defaultCategory?: string;
  defaultNeighborhood?: string;
  syncIntervalHours?: number;
};

type EbEvent = {
  id?: string;
  name?: { text?: string };
  summary?: string;
  description?: { text?: string };
  url?: string;
  start?: { local?: string; timezone?: string };
  end?: { local?: string };
  status?: string;
  is_free?: boolean;
  logo?: { url?: string; original?: { url?: string } };
  online_event?: boolean;
  venue?: {
    name?: string;
    address?: {
      address_1?: string;
      city?: string;
      region?: string;
      postal_code?: string;
      latitude?: string;
      longitude?: string;
    };
  };
  organizer?: { name?: string; url?: string };
  category?: { name?: string };
};

export async function fetchEventbriteEvents(config: EventbriteConfig): Promise<RawEvent[]> {
  const token = process.env.EVENTBRITE_API_TOKEN;
  if (!token) throw new MissingCredentialError("EVENTBRITE_API_TOKEN", "Eventbrite");

  const orgIds = (config.organizationIds ?? []).filter(Boolean);
  if (orgIds.length === 0) {
    throw new Error(
      "Eventbrite source needs at least one organizationId in its config " +
        "(Eventbrite retired public event search; discovery is per-organization)",
    );
  }

  const headers = { Authorization: `Bearer ${token}` };
  const all: EbEvent[] = [];

  for (const orgId of orgIds) {
    let page = 1;
    for (;;) {
      const params = new URLSearchParams({
        status: "live",
        order_by: "start_asc",
        page: String(page),
        expand: "venue,organizer,category",
      });
      const data = await fetchJsonWithRetry<{
        events?: EbEvent[];
        pagination?: { has_more_items?: boolean; page_count?: number };
      }>(
        `https://www.eventbriteapi.com/v3/organizations/${encodeURIComponent(orgId)}/events/?${params.toString()}`,
        { provider: "Eventbrite", headers },
      );
      all.push(...(data.events ?? []));
      if (!data.pagination?.has_more_items || page >= 5) break;
      page++;
    }
  }

  logger.info({ count: all.length }, "Eventbrite events fetched");

  const results: RawEvent[] = [];
  const seen = new Set<string>();

  for (const ev of all) {
    const title = ev.name?.text;
    if (!ev.id || !title) continue;
    if (seen.has(ev.id)) continue;
    seen.add(ev.id);

    if (ev.status && ev.status !== "live") continue;
    if (isNonEventListing(title)) continue;

    const addr = ev.venue?.address;
    // Online events have no venue; keep them only if flagged online.
    if (!ev.online_event) {
      const lat = addr?.latitude ? Number(addr.latitude) : undefined;
      const lon = addr?.longitude ? Number(addr.longitude) : undefined;
      if (!isMetroAtlanta({ city: addr?.city, state: addr?.region, lat, lon })) continue;
    }

    const startLocal = ev.start?.local ?? "";
    const date = startLocal.slice(0, 10);
    if (!date) continue;
    const time = startLocal.length >= 16 ? startLocal.slice(11, 16) : undefined;

    const address = [addr?.address_1, addr?.city, addr?.region, addr?.postal_code]
      .filter(Boolean)
      .join(", ");

    results.push({
      externalId: `eb-${ev.id}`,
      name: title,
      category: ev.category?.name ?? config.defaultCategory,
      date,
      time,
      venue: ev.venue?.name ?? (ev.online_event ? "Online" : ""),
      address: address || undefined,
      neighborhood:
        addr?.city && addr.city !== "Atlanta" ? addr.city : config.defaultNeighborhood,
      description: ev.summary ?? ev.description?.text?.slice(0, 1000),
      cost: ev.is_free ? "Free" : undefined,
      url: ev.url,
      imageUrl: ev.logo?.original?.url ?? ev.logo?.url,
      organizer: ev.organizer?.name,
    });
  }

  logger.info({ usable: results.length, excluded: all.length - results.length }, "Eventbrite events after filtering");
  return results;
}
