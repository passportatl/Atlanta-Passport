// Export dev data (event sources, routes, stops, events) to JSON for the
// one-time snapshot import. Run: npx tsx scripts/snapshot-export.ts
import { db, eventSourcesTable, masterRoutesTable, routeStopsTable, eventsTable } from "@workspace/db";
import { writeFileSync, mkdirSync } from "node:fs";

const out = {
  eventSources: await db.select().from(eventSourcesTable),
  masterRoutes: await db.select().from(masterRoutesTable),
  routeStops: await db.select().from(routeStopsTable),
  events: await db.select().from(eventsTable),
};

mkdirSync("/tmp/snapshot", { recursive: true });
writeFileSync("/tmp/snapshot/data.json", JSON.stringify(out));
console.log(
  Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length])),
);
process.exit(0);
