import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import Logo from "@/components/Logo";
import Sticker from "@/components/Sticker";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-foreground text-background pt-14 pb-10 md:pt-20 md:pb-14 relative overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-[0.06] pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12">
          <div className="md:col-span-5 space-y-5">
            <Logo variant="stacked" />
            <p className="font-serif text-xl md:text-2xl text-brand-yellow max-w-sm leading-snug">
              {t("footer.tagline")}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Sticker color="yellow">{t("footer.sticker_local_picks")}</Sticker>
              <Sticker color="red">{t("footer.sticker_match_day")}</Sticker>
              <Sticker color="lime">{t("footer.sticker_beltline")}</Sticker>
            </div>
            <p className="text-background/75 max-w-sm pt-2">
              {t("footer.built_by")}
            </p>
          </div>

          <div className="md:col-span-3 space-y-4">
            <h4 className="font-display text-xs tracking-[0.18em] text-brand-yellow uppercase">
              {t("footer.explore_heading")}
            </h4>
            <ul className="space-y-3">
              {[
                ["/explore", t("footer.all_spots")],
                ["/beltline", t("nav.beltline_tour")],
                ["/events", t("nav.events")],
                ["/about", t("nav.about")],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-background/80 hover:text-brand-yellow transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Separated business mini-section */}
          <div className="md:col-span-4">
            <div className="bg-background/[0.04] border border-background/15 rounded-2xl p-5 space-y-4">
              <div className="font-display text-[10px] tracking-[0.22em] uppercase text-brand-yellow/90">
                {t("footer.for_businesses")}
              </div>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/apply"
                    className="text-background/85 hover:text-brand-yellow transition-colors"
                  >
                    {t("footer.get_listed")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/partners"
                    className="text-background/85 hover:text-brand-yellow transition-colors"
                  >
                    {t("footer.sponsor_route")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/partners"
                    className="text-background/85 hover:text-brand-yellow transition-colors"
                  >
                    {t("footer.partnership_info")}
                  </Link>
                </li>
              </ul>
              <p className="text-xs text-background/55 leading-snug pt-1">
                {t("footer.founding_sponsor")}{" "}
                <span className="font-display text-brand-yellow tracking-wider">
                  {t("footer.wheelhaus")}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-background/15 text-xs text-background/55 leading-relaxed space-y-2 max-w-3xl">
          <p>{t("footer.disclaimer")}</p>
          <p>&copy; {new Date().getFullYear()} Atlanta Passport. {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}
