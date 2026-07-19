// Data-integrity checks for ingested events — Sprint 4.
// Invalid records are rejected gracefully (logged as run-row errors), never
// inserted, and never abort the run.

import type { NormalizedEvent } from "./normalizer";

export type IntegrityResult =
  | { ok: true }
  | { ok: false; reason: string };

function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function checkEventIntegrity(
  event: NormalizedEvent,
  seenExternalIds: Set<string>,
): IntegrityResult {
  if (!event.name.trim()) {
    return { ok: false, reason: "Event name is blank after normalization" };
  }
  if (!event.date.trim()) {
    return { ok: false, reason: "Event is missing a date" };
  }
  if (!event.venue.trim()) {
    return { ok: false, reason: "Event is missing a venue" };
  }
  if (event.dateIso && !/^\d{4}-\d{2}-\d{2}$/.test(event.dateIso)) {
    return { ok: false, reason: `Invalid ISO date "${event.dateIso}"` };
  }
  if (event.url && !isValidHttpUrl(event.url)) {
    return { ok: false, reason: `Malformed event URL "${event.url.slice(0, 120)}"` };
  }
  if (event.imageUrl && !isValidHttpUrl(event.imageUrl)) {
    return { ok: false, reason: `Malformed image URL "${event.imageUrl.slice(0, 120)}"` };
  }
  if (event.externalId) {
    if (seenExternalIds.has(event.externalId)) {
      return { ok: false, reason: `Duplicate external ID "${event.externalId}" within the same batch` };
    }
    seenExternalIds.add(event.externalId);
  }
  return { ok: true };
}
