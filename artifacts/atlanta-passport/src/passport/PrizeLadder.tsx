import { useTranslation } from "react-i18next";
import { Gift, Ticket, Star, Check, Lock } from "lucide-react";
import { PRIZE_TIERS } from "@/components/PrizesSection";

// Compact, progress-aware prize ladder for the Stamps page. Mirrors the data in
// <PrizesSection> (the big navy marketing block) but reflects the visitor's live
// stamp count — each tier reads as redeemed, ready, or "N to go".
// A redeemed prize tier: its stamp cost (= tier identity) and when it was
// redeemed (ISO timestamp from the server).
export type RedeemedTier = { tierStamps: number; redeemedAt: string };

function formatRedeemedAt(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PrizeLadder({
  collected,
  title,
  redeemedTiers = [],
}: {
  collected: number;
  title?: string;
  // Tiers the visitor has already redeemed, with their redemption timestamps.
  redeemedTiers?: RedeemedTier[];
}) {
  const { t, i18n } = useTranslation();
  const redeemedAtByTier = new Map(redeemedTiers.map((r) => [r.tierStamps, r.redeemedAt]));
  const redeemed = new Set(redeemedTiers.map((r) => r.tierStamps));
  // Effective balance = stamps collected minus the cost of tiers already
  // redeemed. Readiness is gauged against this, NOT the raw count, so a tier
  // can't read as "Ready" once its stamps have been spent on a redemption.
  const spent = redeemedTiers.reduce((sum, r) => sum + r.tierStamps, 0);
  const effective = collected - spent;
  const unlockedCount = PRIZE_TIERS.filter(
    (tier) => !redeemed.has(tier.stamps) && effective >= tier.stamps,
  ).length;

  return (
    <section className="card-pop bg-white overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2.5 bg-brand-lime text-foreground">
        <span
          className="font-black text-xs tracking-widest uppercase"
          style={{ fontFamily: "Bungee, sans-serif" }}
        >
          {title ?? t("prizes.ladderTitle")}
        </span>
        <span className="text-[10px] font-black opacity-80">
          {unlockedCount}/{PRIZE_TIERS.length}
        </span>
      </header>

      <ul>
        {PRIZE_TIERS.map((tier, i) => {
          const isRedeemed = redeemed.has(tier.stamps);
          const unlocked = !isRedeemed && effective >= tier.stamps;
          const remaining = Math.max(tier.stamps - effective, 0);
          const multi = tier.options.length > 1;
          const Icon = multi ? Ticket : i === 0 ? Star : Gift;

          return (
            <li
              key={tier.stamps}
              className="flex gap-3 px-4 py-3 border-t-2 border-dashed border-foreground/15 first:border-t-0"
            >
              <div
                className={`w-12 h-12 rounded-full border-2 border-foreground shadow-pop-sm flex items-center justify-center flex-shrink-0 ${
                  isRedeemed
                    ? "bg-brand-navy text-brand-cream"
                    : unlocked
                      ? "bg-brand-lime text-foreground"
                      : "bg-brand-yellow text-foreground"
                }`}
              >
                <span
                  className="font-black text-lg leading-none"
                  style={{ fontFamily: "Bungee, sans-serif" }}
                >
                  {tier.stamps}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display uppercase tracking-wider text-[11px] font-black leading-tight">
                    {t("prizes.stamps", { count: tier.stamps })}
                  </span>
                  {isRedeemed ? (
                    <span className="inline-flex items-center gap-1 rounded-full border-2 border-foreground bg-brand-navy px-2 py-0.5 font-display text-[9px] tracking-[0.1em] uppercase text-brand-cream shadow-pop-sm shrink-0">
                      <Check className="w-3 h-3" />
                      {t("prizes.redeemed")}
                    </span>
                  ) : unlocked ? (
                    <span className="inline-flex items-center gap-1 rounded-full border-2 border-foreground bg-brand-lime px-2 py-0.5 font-display text-[9px] tracking-[0.1em] uppercase text-foreground shadow-pop-sm shrink-0">
                      <Check className="w-3 h-3" />
                      {t("prizes.ready")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-foreground/45 shrink-0">
                      <Lock className="w-3 h-3" />
                      {t("prizes.toGo", { count: remaining })}
                    </span>
                  )}
                </div>

                {isRedeemed && redeemedAtByTier.get(tier.stamps) && (
                  <span className="block mt-0.5 text-[10px] font-bold text-foreground/55">
                    {t("prizes.redeemedOn", {
                      date: formatRedeemedAt(
                        redeemedAtByTier.get(tier.stamps)!,
                        i18n.language,
                      ),
                    })}
                  </span>
                )}

                {multi && (
                  <span className="block mt-1">
                    <span className="text-[10px] uppercase tracking-widest font-black text-brand-red">
                      {t("prizes.choose")}
                    </span>{" "}
                    <span className="text-[9px] uppercase tracking-wider font-bold text-foreground/55">
                      {t("prizes.limited")}
                    </span>
                  </span>
                )}

                <ul className="mt-1 space-y-1">
                  {tier.options.map((opt) => {
                    const isHotSauceFest = opt.includes("Hot Sauce Fest");
                    return (
                      <li
                        key={opt}
                        className="flex items-start gap-1.5 text-xs font-semibold leading-snug"
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-brand-red" />
                        <span className={unlocked ? "" : "text-foreground/70"}>
                          {opt}
                          {multi && !isHotSauceFest && (
                            <span className="ml-1 text-[10px] font-black uppercase tracking-wider text-brand-red">
                              {t("prizes.onlyOneLeft")}
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
