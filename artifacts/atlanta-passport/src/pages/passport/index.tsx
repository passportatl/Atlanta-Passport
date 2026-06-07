import { Link } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import {
  useListVisitorStamps,
  useListBusinesses,
  getListVisitorStampsQueryKey,
  type Stamp,
  type Business,
} from "@workspace/api-client-react";
import { useVisitor } from "@/passport/visitor-context";
import { basePath } from "@/auth/clerk";
import { StartPassportForm } from "@/passport/StartPassportForm";
import { StampGraphic } from "@/passport/StampGraphic";
import { REWARDS, NEIGHBORHOOD_BY_NAME } from "@/passport/data";
import { Check, Lock } from "lucide-react";

export default function PassportHome() {
  const { visitorId, visitor } = useVisitor();
  const { isSignedIn } = useUser();
  const { signOut } = useClerk();

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

  // All total-stamp reward levels, lowest threshold first
  const totalRewards = [...REWARDS]
    .filter((r) => r.type === "total")
    .sort((a, b) => a.threshold - b.threshold);
  // Completed passports = total-reward milestones the visitor has reached
  const completedPassports = totalRewards.filter((r) => total >= r.threshold).length;
  // Next reward = lowest total threshold not yet hit
  const nextReward = totalRewards.find((r) => total < r.threshold);
  const nextThreshold = nextReward?.threshold ?? 20;
  const progress = Math.min(100, Math.round((total / nextThreshold) * 100));

  const visited = stamps.slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <div
          className="inline-block bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-yellow-foreground))] border-2 border-foreground px-3 py-1 text-xs font-black tracking-widest mb-3"
          style={{ fontFamily: "Bungee, sans-serif" }}
        >
          YOUR PASSPORT
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "Bungee, sans-serif" }}>
            Hey, {visitor?.firstName ?? "Explorer"}.
          </h1>
          {isSignedIn && (
            <button
              type="button"
              onClick={() => signOut({ redirectUrl: `${basePath}/` })}
              className="text-sm font-bold text-[hsl(var(--brand-red))] underline underline-offset-2 hover:text-[hsl(var(--brand-red))]/80"
            >
              Not you? Sign out
            </button>
          )}
        </div>
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
          <div className="text-xs font-black uppercase tracking-wider opacity-60">Completed Passports</div>
          <div className="text-3xl font-black" style={{ fontFamily: "Bungee, sans-serif" }}>
            {completedPassports}
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

          <ul className="mt-4 space-y-2.5 border-t-2 border-foreground/10 pt-3">
            {totalRewards.map((r) => {
              const earned = total >= r.threshold;
              const isNext = nextReward.id === r.id;
              return (
                <li key={r.id} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-foreground text-[11px] font-black ${
                      earned
                        ? "bg-[hsl(var(--brand-lime))] text-foreground"
                        : isNext
                          ? "bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-yellow-foreground))]"
                          : "bg-white text-foreground/60"
                    }`}
                    style={{ fontFamily: "Bungee, sans-serif" }}
                  >
                    {r.threshold}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-black text-sm leading-tight ${earned ? "" : "text-foreground/80"}`}>
                        {r.name}
                      </span>
                      {earned ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--brand-red))]" />
                      ) : (
                        <Lock className="h-3 w-3 shrink-0 opacity-40" />
                      )}
                    </div>
                    <p className="text-xs text-foreground/60 leading-snug mt-0.5">{r.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
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

    </div>
  );
}
