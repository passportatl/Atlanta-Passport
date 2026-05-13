import { Link } from "wouter";
import {
  useListVisitorStamps,
  useListBusinesses,
  getListVisitorStampsQueryKey,
  type Stamp,
  type Business,
} from "@workspace/api-client-react";
import { useVisitor } from "@/passport/visitor-context";
import {
  PUBLIC_ROUTES,
  NEIGHBORHOODS,
  neighborhoodUnlockThreshold,
} from "@/passport/data";
import { Lock, Unlock, MapPin, Sparkles } from "lucide-react";

export default function PassportRoutes() {
  const { visitorId } = useVisitor();
  const { data: stampsRaw } = useListVisitorStamps(visitorId ?? "", {
    query: {
      queryKey: getListVisitorStampsQueryKey(visitorId ?? ""),
      enabled: !!visitorId,
    },
  });
  const { data: businessesRaw } = useListBusinesses();
  const stamps = (stampsRaw as Stamp[] | undefined) ?? [];
  const businesses = (businessesRaw as Business[] | undefined) ?? [];

  const stampsByNeighborhood: Record<string, number> = {};
  stamps.forEach((s) => {
    stampsByNeighborhood[s.neighborhood] = (stampsByNeighborhood[s.neighborhood] ?? 0) + 1;
  });
  const businessesByNeighborhood: Record<string, number> = {};
  businesses.forEach((b) => {
    businessesByNeighborhood[b.neighborhood] = (businessesByNeighborhood[b.neighborhood] ?? 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div>
        <div
          className="inline-block bg-[hsl(var(--brand-lime))] border-2 border-foreground px-3 py-1 text-xs font-black tracking-widest mb-2"
          style={{ fontFamily: "Bungee, sans-serif" }}
        >
          ROUTES
        </div>
        <h1 className="text-3xl font-black" style={{ fontFamily: "Bungee, sans-serif" }}>
          Public & Secret Routes
        </h1>
        <p className="text-sm text-foreground/70 mt-1">
          Curated walks, rides, and night-outs. Each neighborhood unlocks a secret route once you collect enough stamps there.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-black uppercase tracking-wider mb-3 opacity-70">
          Open to everyone
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PUBLIC_ROUTES.map((r) => (
            <div key={r.id} className="card-pop bg-white p-5">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider opacity-70 mb-1">
                <Unlock className="w-3.5 h-3.5" /> Unlocked
              </div>
              <div className="font-black text-lg" style={{ fontFamily: "Bungee, sans-serif" }}>
                {r.name}
              </div>
              <p className="text-sm text-foreground/70 mt-1 mb-3">{r.description}</p>
              <div className="flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-wider opacity-80">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {r.stops} stops
                </span>
                <span>{r.miles}</span>
                <span>{r.pace}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-black uppercase tracking-wider mb-3 opacity-70">
          Secret neighborhood routes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {NEIGHBORHOODS.map((n) => {
            const totalBiz = businessesByNeighborhood[n.name] ?? 0;
            const need = neighborhoodUnlockThreshold(totalBiz);
            const current = stampsByNeighborhood[n.name] ?? 0;
            const unlocked = current >= need && totalBiz > 0;
            const pct = need > 0 ? Math.min(100, Math.round((current / need) * 100)) : 0;
            const reqLabel =
              totalBiz === 0
                ? "Spots coming soon"
                : need < 5
                  ? `All ${need} spot${need === 1 ? "" : "s"} in ${n.name}`
                  : `${need} stamps in ${n.name}`;

            const cardClass = unlocked
              ? "bg-[hsl(var(--brand-navy))] text-[hsl(var(--brand-cream))]"
              : "bg-white";

            return (
              <div key={n.name} className={`card-pop p-5 ${cardClass}`}>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-1">
                  {unlocked ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Unlocked
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" /> Locked
                    </>
                  )}
                </div>
                <div className="font-black text-lg" style={{ fontFamily: "Bungee, sans-serif" }}>
                  {n.secretRouteName}
                </div>
                <p className={`text-sm mt-1 mb-3 ${unlocked ? "opacity-90" : "text-foreground/70"}`}>
                  {n.secretRouteDescription}
                </p>
                <div className="flex items-baseline justify-between mb-1">
                  <div className="text-[11px] font-black uppercase tracking-wider opacity-80">
                    Unlock: {reqLabel}
                  </div>
                  <div className="text-xs font-black">
                    {Math.min(current, need)} / {need || 0}
                  </div>
                </div>
                {!unlocked && need > 0 && (
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {!visitorId && (
          <div className="mt-4 text-sm text-foreground/70">
            <Link href="/passport" className="underline font-bold">
              Start your passport
            </Link>{" "}
            to begin unlocking secret routes.
          </div>
        )}
      </section>
    </div>
  );
}
