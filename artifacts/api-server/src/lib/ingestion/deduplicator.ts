// Duplicate detection for ingested events.
// Three-tier check (in priority order):
//   1. Same source + same externalId → exact match (update lastSeenAt)
//   2. Exact URL match (non-empty) → strong cross-source signal
//   3. Normalized name + same date (≥0.85 Levenshtein) → fuzzy cross-source

import type { NormalizedEvent } from "./normalizer";

export type ExistingEventStub = {
  id: string;
  name: string;
  date: string;
  dateIso: string | null;
  venue: string;
  url: string | null;
  externalId: string | null;
  ingestSourceId: string | null;
  workflowStatus: string;
};

export type DuplicateMatch = {
  type: "same_source_exact" | "url_match" | "cross_source_possible";
  existingId: string;
  confidence: number; // 0–1
};

function normStr(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function datesOverlap(
  a: string,
  b: string,
  aIso: string | null,
  bIso: string | null,
): boolean {
  // Prefer the ISO date when both events have one — it's format-independent
  // ("July 20, 2026" vs "7/20/2026" both normalize to "2026-07-20").
  if (aIso && bIso) {
    return aIso === bIso;
  }
  const na = normStr(a);
  const nb = normStr(b);
  if (!na || !nb) return false;
  return na === nb;
}

// Levenshtein similarity — returns ratio 0–1
function similarity(a: string, b: string): number {
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

export function findDuplicate(
  event: NormalizedEvent,
  sourceId: string,
  existing: ExistingEventStub[],
): DuplicateMatch | null {
  const normName = normStr(event.name);
  const normEventUrl = event.url ? normalizeUrl(event.url) : null;

  for (const e of existing) {
    // Tier 1: exact same source + externalId
    if (
      event.externalId &&
      e.externalId === event.externalId &&
      e.ingestSourceId === sourceId
    ) {
      return { type: "same_source_exact", existingId: e.id, confidence: 1.0 };
    }

    // Tier 2: URL-based exact match (strong cross-source signal)
    if (normEventUrl && e.url) {
      const normExistingUrl = normalizeUrl(e.url);
      if (normEventUrl === normExistingUrl && normEventUrl.length > 10) {
        return { type: "url_match", existingId: e.id, confidence: 0.95 };
      }
    }

    // Tier 3: fuzzy name + overlapping date — cross-source ONLY.
    // Same-source events with similar names (e.g. course sections) are NOT duplicates.
    if (e.ingestSourceId !== sourceId) {
      const nameSim = similarity(normName, normStr(e.name));
      if (nameSim >= 0.85 && datesOverlap(event.date, e.date, event.dateIso, e.dateIso)) {
        const venueSim = similarity(normStr(event.venue), normStr(e.venue));
        const confidence = nameSim * 0.7 + (venueSim >= 0.7 ? 0.2 : 0) + 0.1;
        return {
          type: "cross_source_possible",
          existingId: e.id,
          confidence: Math.min(confidence, 0.9),
        };
      }
    }
  }

  return null;
}
