// Past-event cleanup — archives ingested events whose date has passed.
//
// Only touches events that came from an automated source (ingestSourceId set)
// and have a machine-readable dateIso. Manually submitted events are never
// auto-archived. Archiving removes them from the admin pending queue and,
// for published rows, from the public feed.

import { and, inArray, isNotNull, lt } from "drizzle-orm";
import { db, eventsTable } from "@workspace/db";
import { logger } from "../logger";

// Statuses that should be auto-archived once the event date has passed.
// "rejected", "canceled", and "archived" are left as-is (already terminal).
const ARCHIVABLE_STATUSES = [
  "pending",
  "needs_verification",
  "possible_duplicate",
  "approved",
  "scheduled",
  "published",
];

/** Today's date in Atlanta (America/New_York) as an ISO string "YYYY-MM-DD". */
export function todayIsoAtlanta(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Archive all ingested events dated strictly before today (Atlanta time).
 * Returns the number of events archived.
 */
export async function archivePastIngestedEvents(): Promise<number> {
  const todayIso = todayIsoAtlanta();
  const now = new Date();

  const archived = await db
    .update(eventsTable)
    .set({ workflowStatus: "archived", updatedAt: now })
    .where(
      and(
        isNotNull(eventsTable.ingestSourceId),
        isNotNull(eventsTable.dateIso),
        lt(eventsTable.dateIso, todayIso),
        inArray(eventsTable.workflowStatus, ARCHIVABLE_STATUSES),
      ),
    )
    .returning({ id: eventsTable.id, name: eventsTable.name, dateIso: eventsTable.dateIso });

  if (archived.length > 0) {
    logger.info(
      { count: archived.length, todayIso, sample: archived.slice(0, 5) },
      "Past ingested events archived",
    );
  }

  return archived.length;
}
