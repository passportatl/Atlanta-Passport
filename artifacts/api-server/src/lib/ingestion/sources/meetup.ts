// Meetup GraphQL API adapter.
// Requires MEETUP_ACCESS_TOKEN (OAuth bearer token — Meetup's API requires an
// approved OAuth client; API access is part of Meetup Pro).
//
// Uses keyword/location search over Meetup's GraphQL endpoint centered on
// Atlanta.

import type { RawEvent } from "../normalizer";
import { logger } from "../../logger";
import {
  fetchJsonWithRetry,
  isMetroAtlanta,
  isNonEventListing,
  MissingCredentialError,
} from "./connector-utils";

export type MeetupConfig = {
  lat?: number;      // default Atlanta
  lon?: number;
  radiusMiles?: number; // default 30
  query?: string;    // optional topic keyword
  maxEvents?: number; // default 200
  defaultCategory?: string;
  syncIntervalHours?: number;
};

type MeetupNode = {
  id?: string;
  title?: string;
  description?: string;
  dateTime?: string;   // ISO with offset
  eventUrl?: string;
  imageUrl?: string;
  isOnline?: boolean;
  group?: { name?: string; urlname?: string };
  venue?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
  };
  feeSettings?: { amount?: number; currency?: string } | null;
};

type MeetupSearchResponse = {
  data?: {
    keywordSearch?: {
      pageInfo?: { hasNextPage?: boolean; endCursor?: string };
      edges?: Array<{ node?: MeetupNode }>;
    };
  };
  errors?: Array<{ message?: string }>;
};

const SEARCH_QUERY = `
query ($filter: SearchConnectionFilter!, $first: Int!, $after: String) {
  keywordSearch(filter: $filter, first: $first, after: $after) {
    pageInfo { hasNextPage endCursor }
    edges {
      node {
        ... on Event {
          id
          title
          description
          dateTime
          eventUrl
          imageUrl
          isOnline
          group { name urlname }
          venue { name address city state postalCode lat lng }
          feeSettings { amount currency }
        }
      }
    }
  }
}`;

export async function fetchMeetupEvents(config: MeetupConfig): Promise<RawEvent[]> {
  const token = process.env.MEETUP_ACCESS_TOKEN;
  if (!token) throw new MissingCredentialError("MEETUP_ACCESS_TOKEN", "Meetup");

  const maxEvents = Math.min(Math.max(config.maxEvents ?? 200, 1), 500);
  const nodes: MeetupNode[] = [];
  let after: string | null = null;

  for (;;) {
    const body = JSON.stringify({
      query: SEARCH_QUERY,
      variables: {
        filter: {
          query: config.query ?? "",
          lat: config.lat ?? 33.749,
          lon: config.lon ?? -84.388,
          radius: config.radiusMiles ?? 30,
          source: "EVENTS",
        },
        first: Math.min(50, maxEvents - nodes.length),
        after,
      },
    });

    const json: MeetupSearchResponse = await fetchJsonWithRetry<MeetupSearchResponse>("https://api.meetup.com/gql", {
      provider: "Meetup",
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
    });
    if (json.errors?.length) {
      throw new Error(`Meetup API error: ${json.errors.map((e) => e.message).join("; ").slice(0, 300)}`);
    }

    const conn = json.data?.keywordSearch;
    for (const edge of conn?.edges ?? []) {
      if (edge.node?.id) nodes.push(edge.node);
    }
    if (!conn?.pageInfo?.hasNextPage || nodes.length >= maxEvents) break;
    after = conn.pageInfo.endCursor ?? null;
    if (!after) break;
  }

  logger.info({ count: nodes.length }, "Meetup events fetched");

  const results: RawEvent[] = [];
  const seen = new Set<string>();

  for (const ev of nodes) {
    if (!ev.id || !ev.title || seen.has(ev.id)) continue;
    seen.add(ev.id);
    if (isNonEventListing(ev.title)) continue;

    if (!ev.isOnline) {
      const v = ev.venue;
      if (!isMetroAtlanta({ city: v?.city, state: v?.state, lat: v?.lat, lon: v?.lng })) continue;
    }

    const dt = ev.dateTime ?? "";
    const date = dt.slice(0, 10);
    if (!date) continue;
    const time = dt.length >= 16 ? dt.slice(11, 16) : undefined;

    const v = ev.venue;
    const address = [v?.address, v?.city, v?.state, v?.postalCode].filter(Boolean).join(", ");
    const fee = ev.feeSettings;

    results.push({
      externalId: `mu-${ev.id}`,
      name: ev.title,
      category: config.defaultCategory ?? "Community",
      date,
      time,
      venue: v?.name ?? (ev.isOnline ? "Online" : ""),
      address: address || undefined,
      neighborhood: v?.city && v.city !== "Atlanta" ? v.city : undefined,
      description: ev.description?.slice(0, 1000),
      cost: fee?.amount != null ? (fee.amount === 0 ? "Free" : `$${fee.amount}`) : "Free",
      url: ev.eventUrl,
      imageUrl: ev.imageUrl,
      organizer: ev.group?.name,
    });
  }

  logger.info({ usable: results.length, excluded: nodes.length - results.length }, "Meetup events after filtering");
  return results;
}
