import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";

// TEMPORARY: holding page shown at /partners while partner applications are paused.
// To restore the real Partners page, swap this component back to `Partners` in App.tsx
// (see the comment on the `/partners` <Route>). This file can then be deleted.
export default function PartnersComingSoon() {
  const { t } = useTranslation();
  return (
    <div className="bg-paper texture-paper">
      <section className="container mx-auto px-4 py-24 sm:py-32 flex justify-center">
        <div className="card-pop bg-background max-w-2xl w-full text-center p-8 sm:p-12">
          <div className="inline-block badge-sticker bg-brand-yellow text-brand-yellow-foreground -rotate-1 mb-6">
            {t("partners_page.coming_soon_kicker")}
          </div>
          <h1 className="hero-title text-primary mb-6">
            {t("partners_page.coming_soon_title")}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8">
            {t("partners_page.coming_soon_subtitle")}
          </p>
          <Link
            href="/passport/contact"
            className="button-pop button-pop-yellow inline-flex items-center gap-2"
            data-testid="link-partners-contact"
          >
            {t("partners_page.coming_soon_cta")}
            <ArrowRight className="w-5 h-5 rtl:rotate-180" />
          </Link>
        </div>
      </section>
    </div>
  );
}
