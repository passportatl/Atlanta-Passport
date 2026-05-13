import { Link } from "wouter";
import {
  useListVisitorStamps,
  useListBusinesses,
  getListVisitorStampsQueryKey,
  type Stamp,
  type Business,
} from "@workspace/api-client-react";
import { useVisitor } from "@/passport/visitor-context";
import { StartPassportForm } from "@/passport/StartPassportForm";
import { StampGraphic } from "@/passport/StampGraphic";
import { REWARDS, SAMPLE_NEIGHBORHOODS } from "@/passport/data";
import { ArrowRight } from "lucide-react";

export default function PassportHome() {
  const { visitorId, visitor } = useVisitor();

  const { data: stampsRaw } = useListVisitorStamps(visitorId ?? "", {
    query: {
      queryKey: getListVisitorStampsQueryKey(visitorId ?? ""),
      enabled: !!visitorId,
    },
  });
  const stamps = (stampsRaw as Stamp[] | undefined) ?? [];

  const { data: businessesRaw } = useListBusinesses();
  const businesses = (businessesRaw as Business[] | undefined) ?? [];

  if (!visitorId) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div
            className="inline-block bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-yellow-foreground))] border-2 border-foreground px-3 py-1 text-xs font-black tracking-widest mb-3"
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            DIGITAL PASSPORT
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-1" style={{ fontFamily: "Bungee, sans-serif" }}>
            Your Atlanta Passport
          </h1>
          <p className="text-sm text-foreground/70">
            Collect stamps at participating spots. Unlock secret routes & rewards.
          </p>
        </div>
        <StartPassportForm />
      </div>
    );
  }

  const total = stamps.length;
  const neighborhoods = new Set(stamps.map((s) => s.neighborhood));
  const collectedSlugs = new Set(stamps.map((s) => s.businessSlug));

  // Next reward = lowest total threshold not yet hit
  const nextReward = [...REWARDS]
    .filter((r) => r.type === "total")
    .sort((a, b) => a.threshold - b.threshold)
    .find((r) => total < r.threshold);
  const nextThreshold = nextReward?.threshold ?? 20;
  const progress = Math.min(100, Math.round((total / nextThreshold) * 100));

  // Show recent stamps + locked sample neighborhoods
  const visited = stamps.slice(0, 6);
  const visitedNeighborhoods = new Set(visited.map((s) => s.neighborhood));
  const lockedNeighborhoods = SAMPLE_NEIGHBORHOODS.filter((n) => !visitedNeighborhoods.has(n)).slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <div
          className="inline-block bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-yellow-foreground))] border-2 border-foreground px-3 py-1 text-xs font-black tracking-widest mb-3"
          style={{ fontFamily: "Bungee, sans-serif" }}
        >
          YOUR PASSPORT
        </div>
        <h1 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "Bungee, sans-serif" }}>
          Hey, {visitor?.firstName ?? "Explorer"}.
        </h1>
        <p className="text-sm text-foreground/70 mt-1">
          {total === 0
            ? "Your passport is ready. Scan a QR at any participating spot to start."
            : `You've collected ${total} stamp${total === 1 ? "" : "s"} across ${neighborhoods.size} neighborhood${neighborhoods.size === 1 ? "" : "s"}.`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card-pop bg-white p-4">
          <div className="text-xs font-black uppercase tracking-wider opacity-60">Stamps</div>
          <div className="text-3xl font-black" style={{ fontFamily: "Bungee, sans-serif" }}>
            {total}
          </div>
        </div>
        <div className="card-pop bg-white p-4">
          <div className="text-xs font-black uppercase tracking-wider opacity-60">Neighborhoods</div>
          <div className="text-3xl font-black" style={{ fontFamily: "Bungee, sans-serif" }}>
            {neighborhoods.size}
          </div>
        </div>
      </div>

      {nextReward && (
        <div className="card-pop bg-[hsl(var(--brand-cream))] p-4">
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-xs font-black uppercase tracking-wider">Next reward</div>
            <div className="text-xs font-black opacity-70">
              {total} / {nextThreshold}
            </div>
          </div>
          <div className="font-black text-base mb-2">{nextReward.name}</div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-black" style={{ fontFamily: "Bungee, sans-serif" }}>
            Your Stamps
          </h2>
          <Link href="/passport/stamps" className="text-xs font-black underline">
            See all
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {visited.map((s, i) => {
            const biz = businesses.find((b) => b.slug === s.businessSlug);
            return (
              <div key={s.id} className="flex justify-center">
                <StampGraphic
                  neighborhood={s.neighborhood}
                  iconName={biz?.icon ?? "coffee"}
                  color={biz?.stampColor ?? "yellow"}
                  collectedAt={s.collectedAt as unknown as string}
                  size={100}
                  rotate={i % 2 === 0 ? -4 : 3}
                />
              </div>
            );
          })}
          {lockedNeighborhoods.map((n, i) => (
            <div key={n} className="flex justify-center">
              <StampGraphic
                neighborhood={n}
                color="cream"
                size={100}
                locked
                rotate={i % 2 === 0 ? 2 : -3}
                label="LOCKED"
              />
            </div>
          ))}
        </div>
      </div>

      <Link
        href="/passport/rewards"
        className="card-pop bg-[hsl(var(--brand-yellow))] p-4 flex items-center justify-between hover:translate-x-[1px] hover:translate-y-[1px] transition"
      >
        <div>
          <div className="text-xs font-black uppercase tracking-wider opacity-80">Rewards</div>
          <div className="font-black">See what you've unlocked</div>
        </div>
        <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  );
}
