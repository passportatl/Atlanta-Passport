import { useMemo } from "react";
import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import {
  useListVisitorStamps,
  useListBusinesses,
  useListVisitorRedemptions,
  getListVisitorStampsQueryKey,
  getListVisitorRedemptionsQueryKey,
  type Stamp,
  type Business,
  type Redemption,
} from "@workspace/api-client-react";
import { useVisitor } from "@/passport/visitor-context";
import { StampGraphic } from "@/passport/StampGraphic";
import { PrizeLadder } from "@/passport/PrizeLadder";
import {
  businesses as exploreBusinesses,
  events as sampleEvents,
  businessCategories,
  STAMP_IMAGE_BY_ID,
} from "@/data/sample-data";
import { STAMP_SLUG } from "@/passport/data";
import { formatStampedAt } from "@/passport/stamp-date";

// Featured events are seeded as DB businesses with no coordinates, so resolve
// each to a sample-data business (the map only renders the static dataset) by
// matching the event name to its venue, then the venue to a mapped business.
function resolveEventMapId(name: string): string | undefined {
  const venue = sampleEvents.find((e) => e.name === name)?.venue;
  if (!venue) return undefined;
  return exploreBusinesses.find((b) => b.name === venue)?.id;
}

// Featured events have their own marketing detail page at /events/:id keyed by
// the sample-data event id, matched off the seeded event name.
function resolveEventDetailId(name: string): string | undefined {
  return sampleEvents.find((e) => e.name === name)?.id;
}

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
  iconUrl,
  color,
  onSelect,
  detailHref,
}: {
  name: string;
  meta: string;
  detail?: string;
  stamp?: Stamp;
  iconName: string;
  iconUrl?: string;
  color: string;
  onSelect?: () => void;
  detailHref?: string;
}) {
  const interactive = !!onSelect;
  const stampedAt = stamp ? formatStampedAt(stamp.collectedAt as unknown as string) : null;
  return (
    <li
      onClick={onSelect}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.();
              }
            }
          : undefined
      }
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `Show ${name} on the map` : undefined}
      className={`flex items-center gap-3 px-4 py-3 border-t-2 border-dashed border-foreground/15 first:border-t-0${
        interactive
          ? " cursor-pointer transition-colors hover:bg-[hsl(var(--brand-cream))]/40 focus-visible:outline-none focus-visible:bg-[hsl(var(--brand-cream))]/40"
          : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="font-black text-sm leading-tight">{name}</div>
        <div className="text-[10px] uppercase tracking-wider font-black text-foreground/45">
          {meta}
        </div>
        {stampedAt && (
          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-brand-lime px-2 py-0.5 font-display text-[9px] tracking-[0.1em] uppercase text-foreground shadow-pop-sm">
            {stampedAt}
          </div>
        )}
        {detail && (
          <div className="text-xs font-semibold text-foreground/80 mt-1">{detail}</div>
        )}
        {detailHref && (
          <Link
            href={detailHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label={`View details for ${name}`}
            className="mt-2 inline-flex items-center gap-1 font-display text-[9px] tracking-[0.14em] text-brand-red uppercase hover:underline"
          >
            View details
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="relative shrink-0 w-16 h-16 rounded-md border-2 border-dashed border-foreground/35 bg-[hsl(var(--brand-cream))]/40 flex items-center justify-center">
        {stamp ? (
          <StampGraphic
            neighborhood={stamp.neighborhood}
            iconName={iconName}
            iconUrl={iconUrl}
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

export default function PassportStamps({
  onSelectBusiness,
}: {
  onSelectBusiness?: (id: string) => void;
}) {
  const { visitorId } = useVisitor();
  const { data: stampsRaw } = useListVisitorStamps(visitorId ?? "", {
    query: {
      queryKey: getListVisitorStampsQueryKey(visitorId ?? ""),
      enabled: !!visitorId,
    },
  });
  const { data: businessesRaw } = useListBusinesses();
  const { data: redemptionsRaw } = useListVisitorRedemptions(visitorId ?? "", {
    query: {
      queryKey: getListVisitorRedemptionsQueryKey(visitorId ?? ""),
      enabled: !!visitorId,
    },
  });
  const stamps = (stampsRaw as Stamp[] | undefined) ?? [];
  const apiBusinesses = (businessesRaw as Business[] | undefined) ?? [];
  const redeemedTiers = ((redemptionsRaw as Redemption[] | undefined) ?? []).map(
    (r) => ({ tierStamps: r.tierStamps, redeemedAt: r.redeemedAt }),
  );

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
      <div className="flex flex-wrap items-center gap-2">
        <span className="sticker-pill sticker-lime">Summer 2026</span>
        <div className="flex items-center gap-1.5">
          {["June", "July", "August"].map((m) => {
            const isCurrent =
              m ===
              new Date().toLocaleString("en-US", { month: "long" });
            return (
              <span
                key={m}
                aria-current={isCurrent ? "date" : undefined}
                className={`font-display text-[0.62rem] tracking-[0.14em] uppercase rounded-full border-2 border-foreground px-2.5 py-1 leading-none ${
                  isCurrent
                    ? "bg-brand-yellow text-brand-yellow-foreground shadow-pop-sm"
                    : "bg-white"
                }`}
              >
                {m}
              </span>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-foreground/70">
          Show your Passport at Peachtree Wellness to claim your prize. Use your collected stamps
          like arcade tickets: choose one prize or mix and match multiple prizes based on your
          stamp total. Stamp totals reset every quarter with the new passport.
        </p>
        <p className="text-sm font-bold text-foreground/70 mt-2">
          {collected} of {total} stamps collected
        </p>
        <div className="progress-track mt-2">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <PrizeLadder collected={collected} redeemedTiers={redeemedTiers} />

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
              meta={`${biz.neighborhood} · ${businessCategories(biz).join(" · ")}`}
              detail={biz.offer}
              stamp={stamp}
              iconName={api?.icon ?? "coffee"}
              iconUrl={STAMP_IMAGE_BY_ID[biz.id]}
              color={api?.stampColor ?? "yellow"}
              onSelect={
                onSelectBusiness ? () => onSelectBusiness(biz.id) : undefined
              }
              detailHref={`/listing/${biz.id}`}
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
            {eventRows.map(({ api, stamp }) => {
              const mapId = resolveEventMapId(api.name);
              const detailId = resolveEventDetailId(api.name);
              return (
                <StampListItem
                  key={api.id}
                  name={api.name}
                  meta="Featured Event"
                  detail={api.description ?? undefined}
                  stamp={stamp}
                  iconName={api.icon ?? "star"}
                  color={api.stampColor ?? "orange"}
                  onSelect={
                    onSelectBusiness && mapId
                      ? () => onSelectBusiness(mapId)
                      : undefined
                  }
                  detailHref={detailId ? `/events/${detailId}` : undefined}
                />
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
