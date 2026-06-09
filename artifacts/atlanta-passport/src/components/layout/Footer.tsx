import { useTranslation } from "react-i18next";
import Logo from "@/components/Logo";

// `clearBottomNav` adds extra bottom padding so the footer clears the fixed
// PassportBottomNav on the passport/map-shell pages (which have no marketing
// chrome). Marketing pages render it without the prop.
export default function Footer({
  clearBottomNav = false,
}: {
  clearBottomNav?: boolean;
} = {}) {
  const { t } = useTranslation();

  return (
    <footer
      className={`bg-foreground text-background pt-6 md:pt-8 relative overflow-hidden ${
        clearBottomNav ? "pb-32" : "pb-10 md:pb-14"
      }`}
    >
      <div className="absolute inset-0 dot-grid opacity-[0.06] pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center gap-3 sm:gap-5">
          <Logo variant="nav" />
          <div className="space-y-1 min-w-0">
            <p className="text-xs sm:text-base text-background/75 break-words">
              {t("footer.built_by")}
            </p>
            <p className="text-[11px] sm:text-xs text-background/55 leading-snug break-words">
              {t("footer.founding_sponsor")}{" "}
              <span className="font-display text-brand-yellow tracking-normal sm:tracking-wider">
                {t("footer.wheelhaus")}
              </span>
            </p>
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
