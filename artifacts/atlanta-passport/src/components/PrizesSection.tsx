import { useTranslation } from "react-i18next";
import { Gift, Ticket, Star } from "lucide-react";
import Sticker from "@/components/Sticker";

// Prize ladder is authored from the partner sheet (Prizes tab). Stamp
// thresholds + their prize options stay as data here (like sample-data, the
// brand/specific prize names are intentionally NOT translated); only the
// wrapper copy is i18n'd under `prizes.*`.
export interface PrizeTier {
  stamps: number;
  options: string[];
}

export const PRIZE_TIERS: PrizeTier[] = [
  { stamps: 3, options: ["ATL Sticker Pack"] },
  { stamps: 7, options: ["Small Crystal / Keepsake"] },
  { stamps: 10, options: ["Bottle of Hot Sauce"] },
  {
    stamps: 13,
    options: [
      "$50 Nakato Gift Card",
      "$50 Vickery's Bar & Grill Gift Card",
      "(2) VIP Tickets to Hot Sauce Fest ATL — Nov 14th",
    ],
  },
  {
    stamps: 15,
    options: [
      '"Slice of Heaven" for two with Chef Jeff Varasano — a dozen flavors',
      "(4) VIP Tickets to Hot Sauce Fest ATL — Nov 14th",
    ],
  },
];

export default function PrizesSection() {
  const { t } = useTranslation();
  return (
    <section className="bg-brand-navy text-brand-cream texture-paper section-hero border-b-4 border-foreground">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-10">
          <Sticker color="yellow" rotate="left" className="mb-5">
            {t("prizes.kicker")}
          </Sticker>
          <h2 className="font-serif font-black text-4xl md:text-6xl leading-[0.95] mb-5">
            {t("prizes.title")}
          </h2>
          <p className="text-lg md:text-xl text-brand-cream/85 font-medium max-w-2xl mx-auto leading-relaxed">
            {t("prizes.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PRIZE_TIERS.map((tier, i) => {
            const multi = tier.options.length > 1;
            const Icon = multi ? Ticket : i === 0 ? Star : Gift;
            return (
              <div
                key={tier.stamps}
                className="card-pop bg-brand-cream text-foreground p-6 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-full bg-brand-red text-white border-2 border-foreground shadow-pop-sm flex items-center justify-center flex-shrink-0">
                    <span
                      className="font-black text-xl leading-none"
                      style={{ fontFamily: "Bungee, sans-serif" }}
                    >
                      {tier.stamps}
                    </span>
                  </div>
                  <span className="font-display uppercase tracking-wider text-sm font-black leading-tight">
                    {t("prizes.stamps", { count: tier.stamps })}
                  </span>
                </div>

                {multi && (
                  <span className="mb-2">
                    <span className="text-[11px] uppercase tracking-widest font-black text-brand-red">
                      {t("prizes.choose")}
                    </span>{" "}
                    <span className="text-[10px] uppercase tracking-wider font-bold text-foreground/55">
                      {t("prizes.limited")}
                    </span>
                  </span>
                )}

                <ul className="space-y-2 flex-1">
                  {tier.options.map((opt) => {
                    const isHotSauceFest = opt.includes("Hot Sauce Fest");
                    return (
                      <li key={opt} className="flex items-start gap-2 text-sm font-semibold leading-snug">
                        <Icon className="w-4 h-4 flex-shrink-0 mt-0.5 text-brand-red" />
                        <span>
                          {opt}
                          {multi && !isHotSauceFest && (
                            <span className="ml-1.5 text-[11px] font-black uppercase tracking-wider text-brand-red">
                              {t("prizes.onlyOneLeft")}
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
