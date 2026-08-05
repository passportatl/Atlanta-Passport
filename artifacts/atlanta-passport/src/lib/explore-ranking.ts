import type { ExploreLocation } from "@/hooks/useExploreLocations";

const SESSION_SEED_KEY = "passport-atl-explore-order";

export function getExploreSessionSeed(): string {
  if (typeof window === "undefined") return "server";
  const existing = window.sessionStorage.getItem(SESSION_SEED_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  window.sessionStorage.setItem(SESSION_SEED_KEY, generated);
  return generated;
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rankingGroup(location: ExploreLocation): number {
  if (location.isStampStop) return 0;
  if (location.priorityListing) return 1;
  return 2;
}

function stableKey(location: ExploreLocation): string {
  return (
    location.sortKey ??
    `${location.name.toLocaleLowerCase("en-US")}:${location.canonicalSlug ?? location.id}`
  );
}

export function rankExploreLocations(
  locations: readonly ExploreLocation[],
  sessionSeed: string,
): ExploreLocation[] {
  return [...locations].sort((left, right) => {
    const groupDifference = rankingGroup(left) - rankingGroup(right);
    if (groupDifference !== 0) return groupDifference;

    const group = rankingGroup(left);
    if (group < 2) {
      const priorityDifference =
        (right.priorityRank ?? 0) - (left.priorityRank ?? 0);
      if (priorityDifference !== 0) return priorityDifference;
      return stableKey(left).localeCompare(stableKey(right));
    }

    const randomDifference =
      stableHash(`${sessionSeed}:${stableKey(left)}`) -
      stableHash(`${sessionSeed}:${stableKey(right)}`);
    if (randomDifference !== 0) return randomDifference;
    return stableKey(left).localeCompare(stableKey(right));
  });
}
