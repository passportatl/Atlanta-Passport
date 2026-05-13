import { Link } from "wouter";
import {
  useListVisitorStamps,
  getListVisitorStampsQueryKey,
  type Stamp,
} from "@workspace/api-client-react";
import { useVisitor } from "@/passport/visitor-context";
import { REWARDS } from "@/passport/data";
import { Lock, CheckCircle2, Trophy } from "lucide-react";

const TONE_BG: Record<string, string> = {
  yellow: "bg-[hsl(var(--brand-yellow))]",
  red: "bg-[hsl(var(--brand-red))] text-[hsl(var(--brand-cream))]",
  lime: "bg-[hsl(var(--brand-lime))]",
  navy: "bg-[hsl(var(--brand-navy))] text-[hsl(var(--brand-cream))]",
};

export default function PassportRewards() {
  const { visitorId } = useVisitor();
  const { data: stampsRaw } = useListVisitorStamps(visitorId ?? "", {
    query: {
      queryKey: getListVisitorStampsQueryKey(visitorId ?? ""),
      enabled: !!visitorId,
    },
  });
  const stamps = (stampsRaw as Stamp[] | undefined) ?? [];

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
  const byNeighborhood: Record<string, number> = {};
  stamps.forEach((s) => {
    byNeighborhood[s.neighborhood] = (byNeighborhood[s.neighborhood] ?? 0) + 1;
  });
  const topNeighborhoodCount = Math.max(0, ...Object.values(byNeighborhood));
  const topNeighborhood =
    Object.entries(byNeighborhood).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const evaluated = REWARDS.map((r) => {
    const current = r.type === "total" ? total : topNeighborhoodCount;
    const unlocked = current >= r.threshold;
    return { ...r, current, unlocked, label: r.type === "neighborhood" ? topNeighborhood : null };
  });

  const available = evaluated.filter((r) => r.unlocked);
  const inProgress = evaluated.filter((r) => !r.unlocked);

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
          Hit milestones to unlock entries and secret routes.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-black uppercase tracking-wider mb-3 opacity-70">Available</h2>
        {available.length === 0 ? (
          <div className="card-pop bg-white p-5 text-sm text-foreground/70">
            None unlocked yet. Keep collecting!
          </div>
        ) : (
          <div className="space-y-3">
            {available.map((r) => (
              <div key={r.id} className={`card-pop p-5 ${TONE_BG[r.tone]}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-1">
                      <CheckCircle2 className="w-4 h-4" /> Unlocked
                    </div>
                    <div className="font-black text-lg" style={{ fontFamily: "Bungee, sans-serif" }}>
                      {r.name}
                      {r.label ? ` — ${r.label}` : ""}
                    </div>
                    <p className="text-sm mt-1 opacity-90">{r.description}</p>
                  </div>
                  <Trophy className="w-6 h-6 shrink-0" />
                </div>
                <button
                  className="mt-3 button-pop button-pop-cream text-sm cursor-not-allowed opacity-80"
                  disabled
                >
                  Claim (coming soon)
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-black uppercase tracking-wider mb-3 opacity-70">In progress</h2>
        <div className="space-y-3">
          {inProgress.map((r) => {
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
                    {r.type === "total"
                      ? "Total stamps"
                      : `Best neighborhood${r.label ? ` — ${r.label}` : ""}`}
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
    </div>
  );
}
