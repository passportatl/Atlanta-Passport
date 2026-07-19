// Duplicate detection for ingested events — Sprint 4 weighted scoring.
//
// Every candidate pair gets a confidence score 0–100 built from weighted
// signals (external ID, title similarity, date, time, venue, URL, organizer).
// Outcomes:
//   • same source + same externalId          → 100 (exact; refresh lastSeenAt)
//   • score ≥ AUTO_DUPLICATE_THRESHOLD (95)  → safe duplicate (skip insert)
//   • score ≥ REVIEW_THRESHOLD (70)          → flag for admin review
//   • below                                   → not a duplicate

import type { NormalizedEvent } from "./normalizer";

export type ExistingEventStub = {
  id: string;
  name: string;
  date: string;
  dateIso: string | null;
  time?: string | null;
  venue: string;
  address?: string | null;
  url: string | null;
  externalId: string | null;
  ingestSourceId: string | null;
  workflowStatus: string;
  contactName?: string | null;
};

export const AUTO_DUPLICATE_THRESHOLD = 95;
export const REVIEW_THRESHOLD = 70;

export type DuplicateMatch = {
  type: "same_source_exact" | "auto_duplicate" | "cross_source_possible";
  existingId: string;
  confidence: number; // 0–100
};

function normStr(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function datesMatch(
  a: string,
  b: string,
  aIso: string | null,
  bIso: string | null,
): boolean {
  if (aIso && bIso) return aIso === bIso;
  const na = normStr(a);
  const nb = normStr(b);
  if (!na || !nb) return false;
  return na === nb;
}

// Levenshtein similarity — returns ratio 0–1
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1]![j - 1]!
          : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  const dist = dp[m]![n]!;
  return 1 - dist / Math.max(m, n);
}

// Normalize a URL for comparison — strip protocol, www, trailing slash, query params
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return (u.hostname.replace(/^www\./, "") + u.pathname).replace(/\/$/, "").toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}

function normalizeTime(t: string | null | undefined): string {
  if (!t) return "";
  return t.toLowerCase().replace(/\s+/g, "").replace(/^0/, "");
}

// Weighted confidence score for one candidate pair (0–100).
// Titles must be reasonably similar AND dates must match before the other
// signals are even considered — this keeps unrelated same-venue events apart.
export function scoreDuplicate(event: NormalizedEvent, e: ExistingEventStub): number {
  const nameSim = similarity(normStr(event.name), normStr(e.name));
  const sameDate = datesMatch(event.date, e.date, event.dateIso, e.dateIso);

  // URL exact match is a strong cross-source signal — but never an auto-merge
  // on its own: recurring/series events often share one canonical page URL.
  const urlMatch =
    !!event.url && !!e.url &&
    normalizeUrl(event.url) === normalizeUrl(e.url) &&
    normalizeUrl(event.url).length > 10;

  if (urlMatch) {
    // Same page + same day + similar title → near-certain duplicate.
    if (sameDate && nameSim >= 0.6) return 95;
    // Same page but different day (or dissimilar title) → flag for review only.
    if (sameDate || nameSim >= 0.6) return REVIEW_THRESHOLD + 5;
    return 0;
  }

  if (nameSim < 0.75 || !sameDate) return 0;

  // Base: title similarity (up to 55 points) + same day (20 points)
  let score = Math.round(nameSim * 55) + 20;

  // Venue (up to 12)
  const venueSim = similarity(normStr(event.venue), normStr(e.venue));
  if (venueSim >= 0.85) score += 12;
  else if (venueSim >= 0.6) score += 6;

  // Start time (up to 8)
  const tA = normalizeTime(event.time);
  const tB = normalizeTime(e.time);
  if (tA && tB) score += tA === tB ? 8 : -5; // conflicting explicit times reduce confidence

  // Address (up to 5)
  const addrSim = similarity(normStr(event.address), normStr(e.address));
  if (event.address && e.address && addrSim >= 0.8) score += 5;

  // Organizer/contact (up to 5)
  const orgA = normStr(event.organizer ?? event.contactName);
  const orgB = normStr(e.contactName);
  if (orgA && orgB && similarity(orgA, orgB) >= 0.85) score += 5;

  return Math.max(0, Math.min(score, 99)); // only externalId matches reach 100
}

export function findDuplicate(
  event: NormalizedEvent,
  sourceId: string,
  existing: ExistingEventStub[],
): DuplicateMatch | null {
  let best: DuplicateMatch | null = null;

  for (const e of existing) {
    // Exact: same source + externalId → definitive (score 100)
    if (
      event.externalId &&
      e.externalId === event.externalId &&
      e.ingestSourceId === sourceId
    ) {
      return { type: "same_source_exact", existingId: e.id, confidence: 100 };
    }

    // Same-source events with similar names (e.g. course sections) are NOT
    // duplicates unless the externalId matched above.
    if (e.ingestSourceId === sourceId) continue;

    const score = scoreDuplicate(event, e);
    if (score >= REVIEW_THRESHOLD && (!best || score > best.confidence)) {
      best = {
        type: score >= AUTO_DUPLICATE_THRESHOLD ? "auto_duplicate" : "cross_source_possible",
        existingId: e.id,
        confidence: score,
      };
    }
  }

  return best;
}
