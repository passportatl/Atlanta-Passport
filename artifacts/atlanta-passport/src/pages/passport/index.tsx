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
import { REWARDS, NEIGHBORHOODS, NEIGHBORHOOD_BY_NAME, neighborhoodStatus } from "@/passport/data";
import { ArrowRight, Map, MapPin, Stamp as StampIcon, Award } from "lucide-react";
import { useTranslation } from "react-i18next";

function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    { icon: Map, key: "how_it_works.step1_title", bg: "bg-[hsl(var(--brand-yellow))]", text: "text-[hsl(var(--brand-yellow-foreground))]" },
    { icon: MapPin, key: "how_it_works.step2_title", bg: "bg-[hsl(var(--brand-red))]", text: "text-white" },
    { icon: StampIcon, key: "how_it_works.step3_title", bg: "bg-[hsl(var(--brand-sky))]", text: "text-foreground" },
    { icon: Award, key: "how_it_works.step4_title", bg: "bg-[hsl(var(--brand-lime))]", text: "text-foreground" },
  ];
  return (
    <div className="card-pop bg-white p-5">
      <h2 className="text-xl font-black mb-4" style={{ fontFamily: "Bungee, sans-serif" }}>
        {t("how_it_works.title")}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="text-center">
              <div className={`w-14 h-14 mx-auto rounded-full border-[3px] border-foreground grid place-items-center mb-2 shadow-pop-sm ${s.bg} ${s.text}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div
                className="text-[10px] tracking-[0.18em] uppercase text-[hsl(var(--brand-red))] mb-1"
                style={{ fontFamily: "Bungee, sans-serif" }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="text-sm font-black leading-tight">{t(s.key)}</h3>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
        <HowItWorks />
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

  // Per-neighborhood progression
  const stampsByNeighborhood: Record<string, number> = {};
  stamps.forEach((s) => {
    stampsByNeighborhood[s.neighborhood] = (stampsByNeighborhood[s.neighborhood] ?? 0) + 1;
  });
  const businessesByNeighborhood: Record<string, number> = {};
  businesses.forEach((b) => {
    businessesByNeighborhood[b.neighborhood] = (businessesByNeighborhood[b.neighborhood] ?? 0) + 1;
  });
  const neighborhoodCards = NEIGHBORHOODS.map((n) => {
    const collected = stampsByNeighborhood[n.name] ?? 0;
    const totalBiz = businessesByNeighborhood[n.name] ?? 0;
    const status = neighborhoodStatus(collected, totalBiz);
    return { def: n, collected, totalBiz, status };
  })
    .sort((a, b) => b.collected - a.collected)
    .slice(0, 8);

  const visited = stamps.slice(0, 6);

  return (
    <div className="space-y-6">
      <HowItWorks />
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
            Recent Stamps
          </h2>
          <Link href="/passport/stamps" className="text-xs font-black underline">
            See all
          </Link>
        </div>
        {visited.length === 0 ? (
          <div className="card-pop bg-white p-5 text-sm text-foreground/70">
            No stamps yet. Scan a QR at any participating spot to start.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {visited.map((s, i) => {
              const biz = businesses.find((b) => b.slug === s.businessSlug);
              const def = NEIGHBORHOOD_BY_NAME[s.neighborhood];
              return (
                <div key={s.id} className="flex justify-center">
                  <StampGraphic
                    neighborhood={def?.short ?? s.neighborhood}
                    iconName={biz?.icon ?? def?.stampIcon ?? "coffee"}
                    color={biz?.stampColor ?? def?.stampColor ?? "yellow"}
                    collectedAt={s.collectedAt as unknown as string}
                    size={100}
                    rotate={i % 2 === 0 ? -4 : 3}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-black" style={{ fontFamily: "Bungee, sans-serif" }}>
            Neighborhoods
          </h2>
          <Link href="/passport/rewards" className="text-xs font-black underline">
            View progress
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {neighborhoodCards.map((c, i) => {
            const statusLabel: Record<string, string> = {
              locked: "LOCKED",
              started: "STARTED",
              earned: "EARNED",
              unlocked: "UNLOCKED",
            };
            const statusPill: Record<string, string> = {
              locked: "bg-foreground/10 text-foreground/60",
              started: "bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-yellow-foreground))]",
              earned: "bg-[hsl(var(--brand-lime))] text-foreground",
              unlocked: "bg-[hsl(var(--brand-red))] text-[hsl(var(--brand-cream))]",
            };
            return (
              <div key={c.def.name} className="flex flex-col items-center text-center">
                <StampGraphic
                  neighborhood={c.def.short}
                  iconName={c.def.stampIcon}
                  color={c.def.stampColor}
                  size={92}
                  locked={c.status === "locked"}
                  rotate={i % 2 === 0 ? -3 : 3}
                  label={statusLabel[c.status]}
                />
                <div
                  className={`mt-1.5 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border-2 border-foreground ${statusPill[c.status]}`}
                  style={{ fontFamily: "Bungee, sans-serif" }}
                >
                  {statusLabel[c.status]}
                </div>
                <div className="mt-1 text-[10px] font-black opacity-70">
                  {c.collected}{c.totalBiz > 0 ? ` / ${c.totalBiz}` : ""}
                </div>
              </div>
            );
          })}
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
