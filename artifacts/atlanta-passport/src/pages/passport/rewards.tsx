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
  REWARDS,
  NEIGHBORHOODS,
  NEIGHBORHOOD_EARNED,
  NEIGHBORHOOD_STARTED,
  neighborhoodUnlockThreshold,
  neighborhoodStatus,
} from "@/passport/data";
import { StampGraphic } from "@/passport/StampGraphic";
import { Lock, CheckCircle2, Trophy, Sparkles } from "lucide-react";

const TONE_BG: Record<string, string> = {
  yellow: "bg-[hsl(var(--brand-yellow))]",
  red: "bg-[hsl(var(--brand-red))] text-[hsl(var(--brand-cream))]",
  lime: "bg-[hsl(var(--brand-lime))]",
  navy: "bg-[hsl(var(--brand-navy))] text-[hsl(var(--brand-cream))]",
};

const STATUS_LABEL: Record<string, string> = {
  locked: "Not started",
  started: "Started",
  earned: "Earned",
  unlocked: "Secret route unlocked",
};

const STATUS_PILL: Record<string, string> = {
  locked: "bg-foreground/10 text-foreground/60",
  started: "bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-yellow-foreground))]",
  earned: "bg-[hsl(var(--brand-lime))] text-foreground",
  unlocked: "bg-[hsl(var(--brand-red))] text-[hsl(var(--brand-cream))]",
};

export default function PassportRewards() {
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

  if (!visitorId) {
    return (
      <div className="text-center py-10">
        <p className="mb-4 font-bold">Start your passport to earn rewards.</p>
        <Link href="/passport" className="button-pop button-pop-yellow">
          Get started
        </Link>
      </div>
    );
  }

  const total = stamps.length;
  const stampsByNeighborhood: Record<string, number> = {};
  stamps.forEach((s) => {
    stampsByNeighborhood[s.neighborhood] = (stampsByNeighborhood[s.neighborhood] ?? 0) + 1;
  });
  const businessesByNeighborhood: Record<string, number> = {};
  businesses.forEach((b) => {
    businessesByNeighborhood[b.neighborhood] = (businessesByNeighborhood[b.neighborhood] ?? 0) + 1;
  });

  const evaluatedTotal = REWARDS.map((r) => {
    const unlocked = total >= r.threshold;
    return { ...r, current: total, unlocked };
  });
  const availableTotal = evaluatedTotal.filter((r) => r.unlocked);
  const inProgressTotal = evaluatedTotal.filter((r) => !r.unlocked);

  return (
    <div className="space-y-6">
      <div>
        <div
          className="inline-block bg-[hsl(var(--brand-red))] text-[hsl(var(--brand-cream))] border-2 border-foreground px-3 py-1 text-xs font-black tracking-widest mb-2"
          style={{ fontFamily: "Bungee, sans-serif" }}
        >
          REWARDS
        </div>
        <h1 className="text-3xl font-black" style={{ fontFamily: "Bungee, sans-serif" }}>
          Earn as you explore
        </h1>
        <p className="text-sm text-foreground/70 mt-1">
          Hit milestones to unlock entries. Earn neighborhood stamps to unlock secret routes.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-black uppercase tracking-wider mb-3 opacity-70">Milestones</h2>
        {availableTotal.length > 0 && (
          <div className="space-y-3 mb-3">
            {availableTotal.map((r) => (
              <div key={r.id} className={`card-pop p-5 ${TONE_BG[r.tone]}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-1">
                      <CheckCircle2 className="w-4 h-4" /> Unlocked
                    </div>
                    <div className="font-black text-lg" style={{ fontFamily: "Bungee, sans-serif" }}>
                      {r.name}
                    </div>
                    <p className="text-sm mt-1 opacity-90">{r.description}</p>
                  </div>
                  <Trophy className="w-6 h-6 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-3">
          {inProgressTotal.map((r) => {
            const pct = Math.min(100, Math.round((r.current / r.threshold) * 100));
            return (
              <div key={r.id} className="card-pop bg-white p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="font-black text-base">{r.name}</div>
                    <p className="text-sm text-foreground/70 mt-1">{r.description}</p>
                  </div>
                  <Lock className="w-5 h-5 shrink-0 opacity-60" />
                </div>
                <div className="flex items-baseline justify-between mb-1">
                  <div className="text-[11px] font-black uppercase tracking-wider opacity-70">
                    Total stamps
                  </div>
                  <div className="text-xs font-black">
                    {r.current} / {r.threshold}
                  </div>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-black uppercase tracking-wider opacity-70">Neighborhood stamps</h2>
          <div className="text-[11px] font-bold opacity-60">
            {NEIGHBORHOOD_STARTED} = started · {NEIGHBORHOOD_EARNED} = earned
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {NEIGHBORHOODS.map((n) => {
            const collected = stampsByNeighborhood[n.name] ?? 0;
            const totalBiz = businessesByNeighborhood[n.name] ?? 0;
            const goal = neighborhoodUnlockThreshold(totalBiz);
            const status = neighborhoodStatus(collected, totalBiz);
            const pct = goal > 0 ? Math.min(100, Math.round((collected / goal) * 100)) : 0;
            return (
              <div key={n.name} className="card-pop bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    <StampGraphic
                      neighborhood={n.short}
                      iconName={n.stampIcon}
                      color={n.stampColor}
                      size={84}
                      locked={status === "locked"}
                      label={status === "locked" ? "LOCKED" : "EARNED"}
                      rotate={-3}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-sm leading-tight" style={{ fontFamily: "Bungee, sans-serif" }}>
                      {n.name}
                    </div>
                    <div
                      className={`inline-block mt-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border-2 border-foreground ${STATUS_PILL[status]}`}
                    >
                      {status === "unlocked" ? (
                        <span className="inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> {STATUS_LABEL[status]}
                        </span>
                      ) : (
                        STATUS_LABEL[status]
                      )}
                    </div>
                    <div className="flex items-baseline justify-between mt-2 mb-1">
                      <div className="text-[10px] font-black uppercase tracking-wider opacity-60">
                        {totalBiz === 0
                          ? "No spots yet"
                          : status === "unlocked"
                            ? "Secret route unlocked"
                            : `Next: secret route at ${goal}`}
                      </div>
                      <div className="text-[11px] font-black">
                        {collected} / {goal}
                      </div>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
