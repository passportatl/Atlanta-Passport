import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, BookMarked, LogIn, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { SocialLinks, SOCIALS } from "@/components/SocialLinks";
import { basePath } from "@/auth/clerk";

const navItemClass = (active: boolean) =>
  cn(
    "font-display text-[11px] tracking-[0.16em] uppercase transition-colors px-2 py-1 rounded-md",
    active
      ? "text-white underline decoration-2 underline-offset-4 decoration-brand-yellow"
      : "text-brand-cream/75 hover:text-white"
  );

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();

  // Business listing, event detail AND route detail pages are standalone (opened
  // in their own tab via a scanned link/QR or the "View" buttons), so they hide
  // the "Get Listed" + passport/auth links and surface a single "Back to site"
  // action that closes the tab instead. The /events index keeps the normal nav.
  const isStandalone =
    location.startsWith("/listing") ||
    location.startsWith("/events/") ||
    location.startsWith("/routes/");
  // window.close() only works for script-opened tabs. When the page was opened
  // via a normal target="_blank" link, a scanned QR, or pasted URL, the browser
  // blocks close() silently — so fall back to navigating back into the site.
  const closeTab = () => {
    window.close();
    window.setTimeout(() => {
      if (!window.closed) {
        if (window.history.length > 1) window.history.back();
        else setLocation("/passport/explore");
      }
    }, 120);
  };

  // "Contact us" opens the contact page in its own tab (same convention as the
  // passport bottom nav) so it stays reachable from the marketing site.
  const openContactTab = () => {
    window.open(`${window.location.origin}${basePath}/passport/contact`, "_blank");
  };

  const mobileTouristLinks: { name: string; path: string }[] = [];

  return (
    <header className="sticky top-0 z-50 w-full border-b-[3px] border-foreground bg-[#a71930]">
      <div className="container mx-auto px-3 md:px-4 h-16 flex items-center justify-between gap-2 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4 md:items-start relative">
        {/* Far left: language selector + (desktop) business dropdown + (mobile) logo */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0 md:justify-end md:h-16">
          <LanguageSwitcher align="start" />

          {/* Desktop, left of the centered logo: "Back to site" on listing pages
              (closes the tab), otherwise the "Get Listed" link. */}
          {isStandalone ? (
            <button
              type="button"
              onClick={closeTab}
              className={cn(
                navItemClass(false),
                "hidden md:inline-flex items-center gap-1.5"
              )}
              data-testid="link-back-to-site"
            >
              <X className="w-3.5 h-3.5" />
              Back to site
            </button>
          ) : (
            <button
              type="button"
              onClick={openContactTab}
              className={cn(
                navItemClass(false),
                "hidden md:inline-flex items-center"
              )}
              data-testid="link-contact-us"
            >
              Contact us
            </button>
          )}

          {/* Mobile logo — horizontally centered medallion that hangs below the
              red header bar for prominence. Anchored near the top of the 64px
              (h-16) bar so the bulk of the 84px stamp overflows downward; z-50 +
              drop-shadow keep it sitting above the marquee strip below. */}
          <Link
            href="/"
            aria-label="Atlanta Passport home"
            className="md:hidden absolute left-1/2 top-[6px] -translate-x-1/2 inline-flex items-start pointer-events-none z-50"
          >
            <Logo
              variant="mini"
              asLink={false}
              className="relative drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] pointer-events-auto"
            />
          </Link>
        </div>

        {/* Centered logo — desktop only, sits between "Get on the map" and "Passport" */}
        <Link
          href="/"
          aria-label="Atlanta Passport home"
          className="hidden md:flex justify-center items-start z-50"
        >
          <Logo
            asLink={false}
            className="relative z-10 drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]"
          />
        </Link>

        {/* Desktop Nav — Passport auth + socials (right of the centered logo) */}
        <nav className="hidden md:flex items-center gap-2 justify-start md:h-16">
          {!isStandalone && (
            <>
              <Link
                href="/sign-in"
                className={cn(
                  navItemClass(location.startsWith("/sign-in")),
                  "inline-flex items-center gap-1.5",
                )}
                data-testid="link-nav-login"
              >
                <LogIn className="w-3.5 h-3.5" />
                Log In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-1.5 h-9 px-3 border-2 border-foreground bg-brand-cream text-foreground rounded-xl shadow-[3px_3px_0_0_hsl(var(--foreground))] font-display text-[10px] tracking-[0.14em] uppercase whitespace-nowrap transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                data-testid="link-nav-signup"
              >
                <BookMarked className="w-3.5 h-3.5" />
                Sign Up
              </Link>
            </>
          )}

          {/* Far right: social media icons */}
          <SocialLinks
            className={cn(!isStandalone && "ml-2 pl-3 border-l border-brand-cream/25")}
          />
        </nav>

        {/* Mobile Nav — tourist CTA + menu */}
        <div className="md:hidden flex items-center gap-1.5">
          {isStandalone && (
            <button
              type="button"
              onClick={closeTab}
              aria-label="Back to site"
              title="Back to site"
              className="h-10 px-2.5 inline-flex items-center gap-1.5 border-2 border-foreground bg-brand-cream text-foreground rounded-xl shadow-[3px_3px_0_0_hsl(var(--foreground))] font-display text-[10px] tracking-[0.14em] uppercase whitespace-nowrap active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              data-testid="button-mobile-back-to-site"
            >
              <X className="h-4 w-4" />
              <span>Back</span>
            </button>
          )}
          {!isStandalone && (
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 border-2 border-foreground bg-brand-cream text-foreground rounded-xl shadow-[3px_3px_0_0_hsl(var(--foreground))] hover:bg-brand-cream"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t("nav.toggle_menu")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col bg-paper p-0">
              <div className="flex flex-col gap-5 px-6 pt-10 pb-6">
                {mobileTouristLinks.map((link, i) => (
                  <Link
                    key={`${link.path}-${i}`}
                    href={link.path}
                    className={cn(
                      "font-display text-base tracking-[0.16em] uppercase",
                      location === link.path ? "text-foreground" : "text-foreground/60"
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
                {!isStandalone && (
                  <>
                    <Link
                      href="/sign-in"
                      className={cn(
                        "font-display text-base tracking-[0.16em] uppercase inline-flex items-center gap-2",
                        location.startsWith("/sign-in") ? "text-foreground" : "text-foreground/60",
                      )}
                      data-testid="link-mobile-menu-login"
                    >
                      <LogIn className="w-4 h-4" />
                      Log In
                    </Link>
                    <Link
                      href="/sign-up"
                      className={cn(
                        "font-display text-base tracking-[0.16em] uppercase inline-flex items-center gap-2",
                        location.startsWith("/sign-up") ? "text-foreground" : "text-foreground/60",
                      )}
                      data-testid="link-mobile-menu-signup"
                    >
                      <BookMarked className="w-4 h-4" />
                      Sign Up
                    </Link>
                  </>
                )}

              </div>

              {/* Contact + social section (replaces the old business links,
                  follow-us block, and in-menu language picker) */}
              <div className="mt-auto bg-brand-cream border-t-[3px] border-foreground px-6 py-7 space-y-4">
                <button
                  type="button"
                  onClick={openContactTab}
                  className="block font-display text-sm tracking-[0.14em] uppercase text-foreground/85 hover:text-foreground"
                  data-testid="link-mobile-menu-contact"
                >
                  Contact Us →
                </button>
                <div>
                  <div className="font-display text-[10px] tracking-[0.22em] uppercase text-foreground/50 mb-3">
                    {t("nav.follow_us")}
                  </div>
                  <div className="flex items-center gap-3">
                    {SOCIALS.map(({ name, href, Icon }) => (
                      <a
                        key={name}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={name}
                        title={name}
                        className="inline-flex items-center justify-center h-11 w-11 border-2 border-foreground bg-white text-foreground rounded-xl shadow-[3px_3px_0_0_hsl(var(--foreground))] hover:bg-brand-yellow transition-colors"
                      >
                        <Icon className="w-5 h-5" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          )}
        </div>
      </div>
    </header>
  );
}
