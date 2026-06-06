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
import { CATEGORY_LABEL, businessDiscount } from "@/passport/data";

export default function PassportStamps() {
  const { visitorId } = useVisitor();
  const { data: stampsRaw } = useListVisitorStamps(visitorId ?? "", {
    query: {
      queryKey: getListVisitorStampsQueryKey(visitorId ?? ""),
      enabled: !!visitorId,
    },
  });
  const { data: businessesRaw, isLoading: businessesLoading } = useListBusinesses();
  const stamps = (stampsRaw as Stamp[] | undefined) ?? [];
  const businesses = (businessesRaw as Business[] | undefined) ?? [];

  const stampBySlug = useMemo(() => {
    const m = new Map<string, Stamp>();
    for (const s of stamps) m.set(s.businessSlug, s);
    return m;
  }, [stamps]);

  // Group participating businesses into passport "pages" by neighborhood.
  const sections = useMemo(() => {
    const map = new Map<string, Business[]>();
    for (const b of businesses) {
      const arr = map.get(b.neighborhood) ?? [];
      arr.push(b);
      map.set(b.neighborhood, arr);
    }
    return Array.from(map.entries())
      .map(([neighborhood, list]) => ({
        neighborhood,
        list: list.slice().sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.neighborhood.localeCompare(b.neighborhood));
  }, [businesses]);

  const total = businesses.length;
  const collected = useMemo(
    () => businesses.filter((b) => stampBySlug.has(b.slug)).length,
    [businesses, stampBySlug],
  );
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <div
          className="inline-block bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-yellow-foreground))] border-2 border-foreground px-3 py-1 text-xs font-black tracking-widest mb-2"
          style={{ fontFamily: "Bungee, sans-serif" }}
        >
          MY PASSPORT
        </div>
        <h1 className="text-3xl font-black" style={{ fontFamily: "Bungee, sans-serif" }}>
          Stamp Book
        </h1>
        <p className="text-sm font-bold text-foreground/70 mt-1">
          {collected} of {total} spots stamped · show your Passport to claim each perk
        </p>
        <div className="progress-track mt-3">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {!visitorId && (
        <div className="card-pop bg-[hsl(var(--brand-yellow))] p-4 flex items-center justify-between gap-3">
          <p className="font-bold text-sm text-[hsl(var(--brand-yellow-foreground))]">
            Start your passport to begin collecting stamps.
          </p>
          <Link href="/passport" className="button-pop button-pop-dark shrink-0">
            Get started
          </Link>
        </div>
      )}

      {sections.length === 0 ? (
        <div className="card-pop bg-white p-8 text-center">
          {businessesLoading ? (
            <p className="font-bold text-foreground/70">Loading participating spots…</p>
          ) : (
            <>
              <p className="font-bold mb-1">No participating spots yet.</p>
              <p className="text-sm text-foreground/70">Check back soon — the guide is filling up.</p>
            </>
          )}
        </div>
      ) : (
        sections.map(({ neighborhood, list }) => {
          const sectionCollected = list.filter((b) => stampBySlug.has(b.slug)).length;
          return (
            <section key={neighborhood} className="card-pop bg-white overflow-hidden">
              <header className="flex items-center justify-between px-4 py-2.5 bg-foreground text-[hsl(var(--brand-cream))]">
                <span
                  className="font-black text-xs tracking-widest uppercase"
                  style={{ fontFamily: "Bungee, sans-serif" }}
                >
                  {neighborhood}
                </span>
                <span className="text-[10px] font-black opacity-80">
                  {sectionCollected}/{list.length}
                </span>
              </header>
              <ul>
                {list.map((biz) => {
                  const stamp = stampBySlug.get(biz.slug);
                  return (
                    <li
                      key={biz.slug}
                      className="flex items-center gap-3 px-4 py-3 border-t-2 border-dashed border-foreground/15 first:border-t-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-sm leading-tight">{biz.name}</div>
                        <div className="text-[10px] uppercase tracking-wider font-black text-foreground/45">
                          {CATEGORY_LABEL[biz.category] ?? biz.category}
                        </div>
                        <div className="text-xs font-semibold text-foreground/80 mt-0.5">
                          {businessDiscount(biz.category)}
                        </div>
                      </div>
                      <div className="relative shrink-0 w-16 h-16 rounded-md border-2 border-dashed border-foreground/35 bg-[hsl(var(--brand-cream))]/40 flex items-center justify-center">
                        {stamp ? (
                          <StampGraphic
                            neighborhood={stamp.neighborhood}
                            iconName={biz.icon ?? "coffee"}
                            color={biz.stampColor ?? "yellow"}
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
                })}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
