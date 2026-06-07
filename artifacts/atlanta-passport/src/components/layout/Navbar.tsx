import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ChevronDown, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { SocialLinks, SOCIALS } from "@/components/SocialLinks";
import { useVisitor } from "@/passport/visitor-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItemClass = (active: boolean) =>
  cn(
    "font-display text-[11px] tracking-[0.16em] uppercase transition-colors px-2 py-1 rounded-md",
    active
      ? "text-brand-cream paint-swatch"
      : "text-brand-cream/75 hover:text-white"
  );

export default function Navbar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { visitorId } = useVisitor();
  const hasPassport = !!visitorId;
  const passportShort = hasPassport ? "My Passport" : "Get Passport";

  const mobileTouristLinks = [
    { name: t("nav.explore"), path: "/explore" },
    { name: t("nav.neighborhoods"), path: "/explore" },
    { name: t("nav.local_spots"), path: "/explore" },
  ];

  const businessLinks = [
    { name: t("nav.get_listed"), path: "/apply" },
    { name: t("nav.partner_tiers"), path: "/partners" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b-[3px] border-foreground bg-[#a71930]">
      <div className="container mx-auto px-3 md:px-4 h-16 flex items-center justify-between gap-2 md:gap-4 relative">
        {/* Far left: language selector + (desktop) business dropdown + (mobile) logo */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <LanguageSwitcher align="start" />

          {/* "Get on the map" (For Businesses) — desktop, left of the centered logo */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  navItemClass(location === "/partners" || location === "/apply"),
                  "hidden md:inline-flex items-center gap-1 cursor-pointer"
                )}
                data-testid="button-business-menu"
              >
                {t("nav.for_businesses")}
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="border-2 border-foreground bg-background shadow-pop-sm rounded-xl min-w-[220px] p-1"
            >
              {businessLinks.map((link) => (
                <DropdownMenuItem
                  key={link.path}
                  asChild
                  className="cursor-pointer rounded-md font-display text-[12px] tracking-[0.12em] uppercase px-3 py-2"
                >
                  <Link href={link.path} data-testid={`link-business-${link.path.slice(1)}`}>
                    {link.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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
          className="hidden md:inline-flex absolute left-1/2 top-0 -translate-x-1/2 z-50 items-center"
        >
          <Logo
            asLink={false}
            className="relative z-10 drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]"
          />
        </Link>

        {/* Desktop Nav — Passport + socials (right of the centered logo) */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/explore"
            className={cn(
              navItemClass(location.startsWith("/passport") || location.startsWith("/explore")),
              "inline-flex items-center gap-1.5",
            )}
            data-testid="link-nav-passport"
          >
            <BookMarked className="w-3.5 h-3.5" />
            {hasPassport ? "My Passport" : "Passport"}
          </Link>

          {/* Far right: social media icons */}
          <SocialLinks className="ml-3 pl-3 border-l border-brand-cream/25" />
        </nav>

        {/* Mobile Nav — tourist CTA + menu */}
        <div className="md:hidden flex items-center gap-1.5">
          <Link
            href="/explore"
            aria-label={passportShort}
            title={passportShort}
            className="h-10 px-2.5 inline-flex items-center gap-1.5 border-2 border-foreground bg-brand-cream text-foreground rounded-xl shadow-[3px_3px_0_0_hsl(var(--foreground))] font-display text-[10px] tracking-[0.14em] uppercase whitespace-nowrap active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            data-testid="link-mobile-passport"
          >
            <BookMarked className="h-4 w-4" />
            <span>Pass</span>
          </Link>
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
                <Link
                  href="/explore"
                  className={cn(
                    "font-display text-base tracking-[0.16em] uppercase inline-flex items-center gap-2",
                    location.startsWith("/passport") || location.startsWith("/explore") ? "text-foreground" : "text-foreground/60",
                  )}
                  data-testid="link-mobile-menu-passport"
                >
                  <BookMarked className="w-4 h-4" />
                  {hasPassport ? "My Passport" : "Start Passport"}
                </Link>

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
