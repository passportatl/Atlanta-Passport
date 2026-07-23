import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import Logo from "@/components/Logo";
import wheelhausBikes from "@/assets/images/partner-logos/wheelhaus-bikes.png";
import dpAndCo from "@/assets/images/partner-logos/dp-and-co.png";
import peachtree from "@/assets/images/partner-logos/peachtree.png";
import trapMuseum from "@/assets/images/sheet/trap-museum-logo.jpg";

const PARTNER_LOGOS = [
  { src: dpAndCo, alt: "DP & Co" },
  { src: wheelhausBikes, alt: "Wheelhaus Bikes" },
  { src: peachtree, alt: "Peachtree Wellness" },
  { src: trapMuseum, alt: "The Atlanta Trap Museum" },
];

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
        <div className="flex items-center flex-wrap gap-3 sm:gap-5">
          <Logo variant="stacked" className="shrink-0" />
          <div className="space-y-1 min-w-0 flex-1 basis-48">
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
          <ul
            className="flex items-center gap-2 sm:gap-3 shrink-0"
            aria-label="Partner logos"
          >
            {PARTNER_LOGOS.map((logo) => (
              <li
                key={logo.alt}
                className="flex items-center justify-center bg-white rounded-lg border-2 border-foreground shadow-pop-sm h-12 sm:h-14 w-16 sm:w-20 p-1.5"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 pt-8 border-t border-background/15 text-xs text-background/55 leading-relaxed space-y-2 max-w-3xl">
          <p>{t("footer.disclaimer")}</p>
          <p>
            <Link href="/privacy-policy" className="underline hover:text-background/80">
              Privacy Policy
            </Link>
          </p>
          <p>&copy; {new Date().getFullYear()} Passport ATL. {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}
