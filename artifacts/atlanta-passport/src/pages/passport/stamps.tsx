import { useMemo } from "react";
import { Link } from "wouter";
import {
  useListVisitorStamps,
  useListBusinesses,
  getListVisitorStampsQueryKey,
  type Stamp,
  type Business,
} from "@workspace/api-client-react";
import { useVisitor } from "@/passport/visitor-context";
import { StampGraphic } from "@/passport/StampGraphic";
import { businesses as exploreBusinesses } from "@/data/sample-data";

// The Explore cards (sample-data `businesses`) are the participating spots with
// real Passport offers. Map each to its seeded stamp slug so collected stamps,
// colors, and icons flow through from the backend.
const STAMP_SLUG: Record<string, string> = {
  "atlantucky-brewing": "atlantucky",
  "peachtree-wellness": "peachtree-wellness",
  "wheelhaus-bikes": "wheelhaus",
  "the-westwood": "westwood",
  "vickerys-bar-grill": "vickerys",
};

// Drive the list off STAMP_SLUG (not a broad offer filter) so it stays exactly
// these participating spots even if other Explore businesses gain an offer later.
const PARTICIPATING = Object.keys(STAMP_SLUG)
  .map((id) => exploreBusinesses.find((b) => b.id === id))
  .filter((b): b is (typeof exploreBusinesses)[number] => Boolean(b));

function StampListItem({
  name,
  meta,
  detail,
  stamp,
  iconName,
  color,
}: {
  name: string;
  meta: string;
  detail?: string;
  stamp?: Stamp;
  iconName: string;
  color: string;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3 border-t-2 border-dashed border-foreground/15 first:border-t-0">
      <div className="flex-1 min-w-0">
        <div className="font-black text-sm leading-tight">{name}</div>
        <div className="text-[10px] uppercase tracking-wider font-black text-foreground/45">
          {meta}
        </div>
        {detail && (
          <div className="text-xs font-semibold text-foreground/80 mt-1">{detail}</div>
        )}
      </div>
      <div className="relative shrink-0 w-16 h-16 rounded-md border-2 border-dashed border-foreground/35 bg-[hsl(var(--brand-cream))]/40 flex items-center justify-center">
        {stamp ? (
          <StampGraphic
            neighborhood={stamp.neighborhood}
            iconName={iconName}
            color={color}
            collectedAt={stamp.collectedAt as unknown as string}
            size={74}
            rotate={-8}
          />
        ) : (
          <span
            className="text-[8px] font-black uppercase tracking-widest text-foreground/35"
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            Stamp
          </span>
        )}
      </div>
    </li>
  );
}

export default function PassportStamps() {
  const { visitorId } = useVisitor();
  const { data: stampsRaw } = useListVisitorStamps(visitorId ?? "", {
    query: {
      queryKey: getListVisitorStampsQueryKey(visitorId ?? ""),
      enabled: !!visitorId,
    },
  });
  const { data: businessesRaw } = useListBusinesses();
  const stamps = (stampsRaw as Stamp[] | undefined) ?? [];
  const apiBusinesses = (businessesRaw as Business[] | undefined) ?? [];

  const stampBySlug = useMemo(() => {
    const m = new Map<string, Stamp>();
    for (const s of stamps) m.set(s.businessSlug, s);
    return m;
  }, [stamps]);

  const apiBySlug = useMemo(() => {
    const m = new Map<string, Business>();
    for (const b of apiBusinesses) m.set(b.slug, b);
    return m;
  }, [apiBusinesses]);

  const rows = useMemo(
    () =>
      PARTICIPATING.map((biz) => {
        const slug = STAMP_SLUG[biz.id];
        return {
          biz,
          stamp: slug ? stampBySlug.get(slug) : undefined,
          api: slug ? apiBySlug.get(slug) : undefined,
        };
      }),
    [stampBySlug, apiBySlug],
  );

  // Featured events are seeded as DB businesses (category "events") and are
  // scannable bonus stamps — list them below the participating spots and fold
  // them into the running stamp total.
  const eventRows = useMemo(
    () =>
      apiBusinesses
        .filter((b) => b.category === "events")
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((api) => ({ api, stamp: stampBySlug.get(api.slug) })),
    [apiBusinesses, stampBySlug],
  );

  const spotsCollected = rows.filter((r) => r.stamp).length;
  const eventsCollected = eventRows.filter((r) => r.stamp).length;
  const total = rows.length + eventRows.length;
  const collected = spotsCollected + eventsCollected;
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-bold text-foreground/70">
          {collected} of {total} stamps collected · show your Passport to claim each offer
        </p>
        <div className="progress-track mt-2">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {!visitorId && (
        <div className="card-pop bg-[hsl(var(--brand-yellow))] p-3 flex items-center justify-between gap-3">
          <p className="font-bold text-sm text-[hsl(var(--brand-yellow-foreground))]">
            Start your passport to begin collecting stamps.
          </p>
          <Link href="/passport" className="button-pop button-pop-dark shrink-0">
            Get started
          </Link>
        </div>
      )}

      <section className="card-pop bg-white overflow-hidden">
        <header className="flex items-center justify-between px-4 py-2.5 bg-foreground text-[hsl(var(--brand-cream))]">
          <span
            className="font-black text-xs tracking-widest uppercase"
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            Participating Spots
          </span>
          <span className="text-[10px] font-black opacity-80">
            {spotsCollected}/{rows.length}
          </span>
        </header>
        <ul>
          {rows.map(({ biz, stamp, api }) => (
            <StampListItem
              key={biz.id}
              name={biz.name}
              meta={`${biz.neighborhood} · ${biz.category}`}
              detail={biz.offer}
              stamp={stamp}
              iconName={api?.icon ?? "coffee"}
              color={api?.stampColor ?? "yellow"}
            />
          ))}
        </ul>
      </section>

      {eventRows.length > 0 && (
        <section className="card-pop bg-white overflow-hidden">
          <header className="flex items-center justify-between px-4 py-2.5 bg-[hsl(var(--brand-orange))] text-[hsl(var(--brand-yellow-foreground))]">
            <span
              className="font-black text-xs tracking-widest uppercase"
              style={{ fontFamily: "Bungee, sans-serif" }}
            >
              Featured Events · Bonus Stamps
            </span>
            <span className="text-[10px] font-black opacity-80">
              {eventsCollected}/{eventRows.length}
            </span>
          </header>
          <ul>
            {eventRows.map(({ api, stamp }) => (
              <StampListItem
                key={api.id}
                name={api.name}
                meta="Featured Event"
                detail={api.description ?? undefined}
                stamp={stamp}
                iconName={api.icon ?? "star"}
                color={api.stampColor ?? "orange"}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
