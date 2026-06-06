import { useTranslation } from "react-i18next";

// Black legal disclaimer band shown at the bottom of the passport pages
// (these have a fixed bottom nav instead of the marketing footer). The extra
// bottom padding clears the fixed PassportBottomNav so the text stays visible.
export default function LegalDisclaimer() {
  const { t } = useTranslation();

  return (
    <div className="bg-foreground text-background">
      <div className="container mx-auto px-4 pt-8 pb-32 max-w-3xl space-y-2 text-xs text-background/55 leading-relaxed">
        <p>{t("footer.disclaimer")}</p>
        <p>
          &copy; {new Date().getFullYear()} Atlanta Passport. {t("footer.rights")}
        </p>
      </div>
    </div>
  );
}
