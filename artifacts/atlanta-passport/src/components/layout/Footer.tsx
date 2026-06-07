import { useTranslation } from "react-i18next";
import Logo from "@/components/Logo";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-foreground text-background pt-6 pb-10 md:pt-8 md:pb-14 relative overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-[0.06] pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center gap-5">
          <Logo variant="nav" />
          <div className="space-y-1">
            <p className="text-background/75">
              {t("footer.built_by")}
            </p>
            <p className="text-xs text-background/55 leading-snug">
              {t("footer.founding_sponsor")}{" "}
              <span className="font-display text-brand-yellow tracking-wider">
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
