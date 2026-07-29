import { useMemo } from "react";
import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import {
  useListVisitorStamps,
  useListBusinesses,
  getListVisitorStampsQueryKey,
  type Stamp,
  type Business,
} from "@workspace/api-client-react";
import { useVisitor } from "@/passport/visitor-context";
import { StampGraphic } from "@/passport/StampGraphic";
import { STAMP_SLUG } from "@/passport/data";
import { STAMP_IMAGE_BY_ID } from "@/data/sample-data";
import { formatStampedAt } from "@/passport/stamp-date";

// A stamp the visitor can collect at this event/location. `spot` targets are
// sample-data businesses (resolved to their seeded slug via STAMP_SLUG); `event`
// targets are featured events seeded as DB businesses (category "events"),
// resolved by matching the seeded business name to the event name.
export type StampTarget =
  | { kind: "spot"; sampleId: string; name: string; meta: string; detail?: string; detailHref?: string }
  | { kind: "event"; eventName: string; name: string; meta: string; detail?: string; detailHref?: string };

function StampRow({
  name,
  meta,
  detail,
  detailHref,
  stamp,
  iconName,
  iconUrl,
  color,
}: {
  name: string;
  meta: string;
  detail?: string;
  detailHref?: string;
  stamp?: Stamp;
  iconName: string;
  iconUrl?: string;
  color: string;
}) {
  const stampedAt = stamp ? formatStampedAt(stamp.collectedAt as unknown as string) : null;
  return (
    <li className="flex items-center gap-3 px-4 py-3 border-t-2 border-dashed border-foreground/15 first:border-t-0">
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
            aria-label={`View details for ${name}`}
            className="mt-2 inline-flex items-center gap-1 font-display text-[9px] tracking-[0.14em] text-brand-red uppercase hover:underline"
          >
            View details
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="relative shrink-0 w-16 h-16 rounded-md border-2 border-dashed border-foreground/35 bg-brand-cream/40 flex items-center justify-center">
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

export default function StampChecklist({ targets }: { targets: StampTarget[] }) {
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

  const eventByName = useMemo(() => {
    const m = new Map<string, Business>();
    for (const b of apiBusinesses) {
      if (b.category === "events") m.set(b.name, b);
    }
    return m;
  }, [apiBusinesses]);

  const rows = useMemo(
    () =>
      targets.map((target) => {
        // Spot slugs come straight from STAMP_SLUG, so collected-state resolves
        // even if /businesses is unavailable; the API record only supplies the
        // stamp icon/color. Event slugs must come from the seeded API record.
        const slug =
          target.kind === "spot" ? STAMP_SLUG[target.sampleId] : eventByName.get(target.eventName)?.slug;
        const api = slug ? apiBySlug.get(slug) : undefined;
        return {
          key: target.kind === "spot" ? target.sampleId : target.eventName,
          name: target.name,
          meta: target.meta,
          detail: target.detail,
          detailHref: target.detailHref,
          stamp: slug ? stampBySlug.get(slug) : undefined,
          iconName: api?.icon ?? (target.kind === "event" ? "star" : "coffee"),
          iconUrl:
            target.kind === "spot"
              ? STAMP_IMAGE_BY_ID[target.sampleId]
              : undefined,
          color: api?.stampColor ?? (target.kind === "event" ? "orange" : "yellow"),
        };
      }),
    [targets, apiBySlug, eventByName, stampBySlug],
  );

  const collected = rows.filter((r) => r.stamp).length;
  const total = rows.length;

  return (
    <section className="card-pop bg-[var(--surface-card,#ffffff)] overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2.5 bg-foreground text-[var(--surface-header-fg,hsl(var(--brand-cream)))]">
        <span
          className="font-black text-xs tracking-widest uppercase"
          style={{ fontFamily: "Bungee, sans-serif" }}
        >
          Stamps to Collect
        </span>
        <span className="text-[10px] font-black opacity-80">
          {collected}/{total}
        </span>
      </header>
      <ul>
        {rows.map((r) => (
          <StampRow
            key={r.key}
            name={r.name}
            meta={r.meta}
            detail={r.detail}
            detailHref={r.detailHref}
            stamp={r.stamp}
            iconName={r.iconName}
            iconUrl={r.iconUrl}
            color={r.color}
          />
        ))}
      </ul>
      <div className="px-4 py-3 border-t-2 border-dashed border-foreground/15 bg-brand-cream/30">
        {visitorId ? (
          <p className="text-xs font-bold text-foreground/70 leading-snug">
            Scan the QR code at the location or event — or speak to an employee there — to collect each stamp.
          </p>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-foreground/70 leading-snug">
              Start your passport to begin collecting.
            </p>
            <Link href="/passport" className="button-pop button-pop-dark shrink-0 text-xs">
              Get started
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
