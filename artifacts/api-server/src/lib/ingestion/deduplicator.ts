// Duplicate detection for ingested events.
// Two-tier check:
//   1. Same source + same externalId → exact match (update lastSeenAt)
//   2. Normalized name + overlapping date → possible duplicate across sources

import type { NormalizedEvent } from "./normalizer";

export type ExistingEventStub = {
  id: string;
  name: string;
  date: string;
  dateIso: string | null;
  venue: string;
  externalId: string | null;
  ingestSourceId: string | null;
  workflowStatus: string;
};

export type DuplicateMatch = {
  type: "same_source_exact" | "cross_source_possible";
  existingId: string;
};

function normStr(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function datesOverlap(a: string, b: string): boolean {
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

export function findDuplicate(
  event: NormalizedEvent,
  sourceId: string,
  existing: ExistingEventStub[],
): DuplicateMatch | null {
  const normName = normStr(event.name);

  for (const e of existing) {
    // Tier 1: exact same source + externalId
    if (
      event.externalId &&
      e.externalId === event.externalId &&
      e.ingestSourceId === sourceId
    ) {
      return { type: "same_source_exact", existingId: e.id };
    }

    // Tier 2: fuzzy name match + overlapping date
    const nameSim = similarity(normName, normStr(e.name));
    if (nameSim >= 0.85 && datesOverlap(event.date, e.date)) {
      return { type: "cross_source_possible", existingId: e.id };
    }
  }

  return null;
}
