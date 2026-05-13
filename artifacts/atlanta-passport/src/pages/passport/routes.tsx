import { Link } from "wouter";
import {
  useListVisitorStamps,
  getListVisitorStampsQueryKey,
  type Stamp,
} from "@workspace/api-client-react";
import { useVisitor } from "@/passport/visitor-context";
import { PUBLIC_ROUTES, SECRET_ROUTES } from "@/passport/data";
import { Lock, Unlock, MapPin, Sparkles } from "lucide-react";

const TONE_BG: Record<string, string> = {
  yellow: "bg-[hsl(var(--brand-yellow))]",
  red: "bg-[hsl(var(--brand-red))] text-[hsl(var(--brand-cream))]",
  lime: "bg-[hsl(var(--brand-lime))]",
  navy: "bg-[hsl(var(--brand-navy))] text-[hsl(var(--brand-cream))]",
};

export default function PassportRoutes() {
  const { visitorId } = useVisitor();
  const { data: stampsRaw } = useListVisitorStamps(visitorId ?? "", {
    query: {
      queryKey: getListVisitorStampsQueryKey(visitorId ?? ""),
      enabled: !!visitorId,
    },
  });
  const stamps = (stampsRaw as Stamp[] | undefined) ?? [];
  const total = stamps.length;
  const byNeighborhood: Record<string, number> = {};
  stamps.forEach((s) => {
    byNeighborhood[s.neighborhood] = (byNeighborhood[s.neighborhood] ?? 0) + 1;
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
          Curated walks, rides, and night-outs. Some unlock as you stamp.
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
          Secret routes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SECRET_ROUTES.map((r) => {
            const current =
              r.unlock.type === "total"
                ? total
                : byNeighborhood[r.unlock.neighborhood] ?? 0;
            const need = r.unlock.count;
            const unlocked = current >= need;
            const pct = Math.min(100, Math.round((current / need) * 100));
            const reqLabel =
              r.unlock.type === "total"
                ? `${need} total stamps`
                : `${need} stamps in ${r.unlock.neighborhood}`;

            return (
              <div
                key={r.id}
                className={`card-pop p-5 ${unlocked ? TONE_BG[r.tone] : "bg-white"}`}
              >
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-1">
                  {unlocked ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Secret route unlocked!
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" /> Locked
                    </>
                  )}
                </div>
                <div className="font-black text-lg" style={{ fontFamily: "Bungee, sans-serif" }}>
                  {r.name}
                </div>
                <p className={`text-sm mt-1 mb-3 ${unlocked ? "opacity-90" : "text-foreground/70"}`}>
                  {r.description}
                </p>
                <div className="flex items-baseline justify-between mb-1">
                  <div className="text-[11px] font-black uppercase tracking-wider opacity-80">
                    Unlock: {reqLabel}
                  </div>
                  <div className="text-xs font-black">
                    {Math.min(current, need)} / {need}
                  </div>
                </div>
                {!unlocked && (
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
