import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, BookMarked, LogIn, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { SocialLinks, SOCIALS } from "@/components/SocialLinks";
import { useUser } from "@clerk/react";

const navItemClass = (active: boolean) =>
  cn(
    "font-display text-[11px] tracking-[0.16em] uppercase transition-colors px-2 py-1 rounded-md",
    active
      ? "text-white underline decoration-2 underline-offset-4 decoration-brand-yellow"
      : "text-brand-cream/75 hover:text-white"
  );

export default function Navbar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { isSignedIn } = useUser();
  const passportShort = isSignedIn ? "My Passport" : "Log In";

  // Business listing pages are standalone (often opened in their own tab via a
  // scanned link/QR), so they hide the "Get Listed" + passport/auth links and
  // surface a single "Back to site" action that closes the tab instead.
  const isListing = location.startsWith("/listing");
  const closeTab = () => window.close();

  const mobileTouristLinks = [
    { name: t("nav.explore"), path: "/passport/explore" },
    { name: t("nav.neighborhoods"), path: "/passport/explore" },
    { name: t("nav.local_spots"), path: "/passport/explore" },
  ];

  const businessLinks = [
    { name: t("nav.get_listed"), path: "/apply" },
    { name: t("nav.partner_tiers"), path: "/partners" },
  ].filter((l) => !(isListing && l.path === "/apply"));

  return (
    <header className="sticky top-0 z-50 w-full border-b-[3px] border-foreground bg-[#a71930]">
      <div className="container mx-auto px-3 md:px-4 h-16 flex items-center justify-between gap-2 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4 md:items-start relative">
        {/* Far left: language selector + (desktop) business dropdown + (mobile) logo */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0 md:justify-end md:h-16">
          <LanguageSwitcher align="start" />

          {/* Desktop, left of the centered logo: "Back to site" on listing pages
              (closes the tab), otherwise the "Get Listed" link. */}
          {isListing ? (
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
            <Link
              href="/partners"
              className={cn(
                navItemClass(location === "/partners"),
                "hidden md:inline-flex items-center"
              )}
              data-testid="link-get-listed"
            >
              {t("nav.get_listed")}
            </Link>
          )}

          {/* Mobile logo (stays on the left) */}
          <Link
            href="/"
            aria-label="Atlanta Passport home"
            className="md:hidden relative z-50 inline-flex items-center shrink-0 self-start"
          >
            <Logo
              asLink={false}
              className="relative z-10 drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]"
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
          {!isListing &&
            (isSignedIn ? (
              <Link
                href="/passport"
                className={cn(
                  navItemClass(location.startsWith("/passport")),
                  "inline-flex items-center gap-1.5",
                )}
                data-testid="link-nav-passport"
              >
                <BookMarked className="w-3.5 h-3.5" />
                My Passport
              </Link>
            ) : (
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
            ))}

          {/* Far right: social media icons */}
          <SocialLinks
            className={cn(!isListing && "ml-2 pl-3 border-l border-brand-cream/25")}
          />
        </nav>

        {/* Mobile Nav — tourist CTA + menu */}
        <div className="md:hidden flex items-center gap-1.5">
          {isListing ? (
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
          ) : (
            <Link
              href={isSignedIn ? "/passport" : "/sign-in"}
              aria-label={passportShort}
              title={passportShort}
              className="h-10 px-2.5 inline-flex items-center gap-1.5 border-2 border-foreground bg-brand-cream text-foreground rounded-xl shadow-[3px_3px_0_0_hsl(var(--foreground))] font-display text-[10px] tracking-[0.14em] uppercase whitespace-nowrap active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              data-testid="link-mobile-passport"
            >
              {isSignedIn ? <BookMarked className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
              <span>{isSignedIn ? "Pass" : "Log In"}</span>
            </Link>
          )}
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
                {!isListing &&
                  (isSignedIn ? (
                    <Link
                      href="/passport"
                      className={cn(
                        "font-display text-base tracking-[0.16em] uppercase inline-flex items-center gap-2",
                        location.startsWith("/passport") ? "text-foreground" : "text-foreground/60",
                      )}
                      data-testid="link-mobile-menu-passport"
                    >
                      <BookMarked className="w-4 h-4" />
                      My Passport
                    </Link>
                  ) : (
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
                  ))}

                {/* Social links */}
                <div className="pt-2 border-t border-foreground/15">
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
                        className="inline-flex items-center justify-center h-11 w-11 border-2 border-foreground bg-brand-cream text-foreground rounded-xl shadow-[3px_3px_0_0_hsl(var(--foreground))] hover:bg-white transition-colors"
                      >
                        <Icon className="w-5 h-5" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Language picker inside the menu */}
                <div className="pt-2 border-t border-foreground/15">
                  <LanguageSwitcher variant="menu" />
                </div>
              </div>

              {/* Separated business section */}
              <div className="mt-auto bg-brand-cream border-t-[3px] border-foreground px-6 py-7 space-y-4">
                <div className="font-display text-[10px] tracking-[0.22em] uppercase text-foreground/60">
                  ★ {t("nav.for_businesses")}
                </div>
                {businessLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    className="block font-display text-sm tracking-[0.14em] uppercase text-foreground/85 hover:text-foreground"
                  >
                    {link.name} →
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
