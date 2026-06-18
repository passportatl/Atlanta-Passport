// Formats a stamp's collectedAt timestamp into a short date + time label shown
// on the stamp row, e.g. "Stamped Jun 18, 2026 · 3:42 PM". Returns null when no
// timestamp is available (stamp not yet collected).
export function formatStampedAt(collectedAt?: string | Date | null): string | null {
  if (!collectedAt) return null;
  const d = new Date(collectedAt);
  if (Number.isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `Stamped ${date} · ${time}`;
}
