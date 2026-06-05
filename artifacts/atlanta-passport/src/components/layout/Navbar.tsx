import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, MoveRight, ChevronDown, BookMarked, Instagram } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
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
      ? "text-brand-navy bg-brand-yellow"
      : "text-brand-cream/75 hover:text-white"
  );

export default function Navbar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { visitorId, visitor } = useVisitor();
  const hasPassport = !!visitorId;
  const passportLabel = hasPassport
    ? `${visitor?.firstName ? `${visitor.firstName}'s` : "My"} Passport`
    : "Start Your Passport";
  const passportShort = hasPassport ? "My Passport" : "Get Passport";

  const touristLinks = [
    { name: t("nav.beltline_tour"), path: "/beltline" },
    { name: t("nav.events"), path: "/events" },
    { name: t("nav.about"), path: "/about" },
  ];

  const mobileTouristLinks = [
    { name: t("nav.explore"), path: "/explore" },
    { name: t("nav.beltline_tour"), path: "/beltline" },
    { name: t("nav.neighborhoods"), path: "/explore" },
    { name: t("nav.local_spots"), path: "/explore" },
    { name: t("nav.events"), path: "/events" },
    { name: t("nav.about"), path: "/about" },
  ];

  const businessLinks = [
    { name: t("nav.get_listed"), path: "/apply" },
    { name: t("nav.partner_tiers"), path: "/partners" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b-[3px] border-foreground bg-brand-navy">
      <div className="container mx-auto px-3 md:px-4 h-16 flex items-center justify-between gap-2 md:gap-4">
        <Link
          href="/"
          aria-label="Atlanta Passport home"
          className="relative z-50 inline-flex items-center shrink-0 self-start"
        >
          <span
            aria-hidden
            className="absolute -left-2 -right-3 top-8 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r from-brand-red via-brand-orange to-brand-yellow z-0"
          />
          <Logo
            asLink={false}
            className="relative z-10 drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]"
          />
        </Link>

        {/* Desktop Nav — tourist-first */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/" className={navItemClass(location === "/")}>{t("nav.home")}</Link>
          {touristLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={navItemClass(location === link.path)}
            >
              {link.name}
            </Link>
          ))}

          {/* For Businesses dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  navItemClass(location === "/partners" || location === "/apply"),
                  "inline-flex items-center gap-1 cursor-pointer"
                )}
                data-testid="button-business-menu"
              >
                {t("nav.for_businesses")}
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
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

          <Link
            href="/passport"
            className={cn(
              navItemClass(location.startsWith("/passport")),
              "inline-flex items-center gap-1.5 ml-1",
            )}
            data-testid="link-nav-passport"
          >
            <BookMarked className="w-3.5 h-3.5" />
            {hasPassport ? "My Passport" : "Passport"}
          </Link>

          <a
            href="https://instagram.com/passport.atl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram @passport.atl"
            title="@passport.atl"
            className="ml-1 inline-flex items-center gap-1.5 text-brand-cream/75 hover:text-white transition-colors font-display text-[11px] tracking-[0.12em] uppercase"
          >
            <Instagram className="w-4 h-4" />
            <span className="hidden lg:inline">@passport.atl</span>
          </a>

          <div className="ml-3">
            <LanguageSwitcher />
          </div>
          <Link
            href={hasPassport ? "/passport" : "/explore"}
            className="button-pop button-pop-yellow ml-3 text-xs px-5 py-2.5"
            data-testid="button-nav-cta"
          >
            {hasPassport ? passportLabel : t("nav.start_exploring")}{" "}
            <MoveRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </nav>

        {/* Mobile Nav — tourist CTA + menu */}
        <div className="md:hidden flex items-center gap-1.5">
          <Link
            href="/passport"
            aria-label={passportShort}
            title={passportShort}
            className="h-10 px-2.5 inline-flex items-center gap-1.5 border-2 border-foreground bg-brand-cream text-foreground rounded-xl shadow-[3px_3px_0_0_hsl(var(--foreground))] font-display text-[10px] tracking-[0.14em] uppercase whitespace-nowrap active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            data-testid="link-mobile-passport"
          >
            <BookMarked className="h-4 w-4" />
            <span>Pass</span>
          </Link>
          <LanguageSwitcher />
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
                <Link
                  href="/"
                  className={cn(
                    "font-display text-base tracking-[0.16em] uppercase",
                    location === "/" ? "text-foreground" : "text-foreground/60"
                  )}
                >
                  {t("nav.home")}
                </Link>
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
                  href="/passport"
                  className={cn(
                    "font-display text-base tracking-[0.16em] uppercase inline-flex items-center gap-2",
                    location.startsWith("/passport") ? "text-foreground" : "text-foreground/60",
                  )}
                  data-testid="link-mobile-menu-passport"
                >
                  <BookMarked className="w-4 h-4" />
                  {hasPassport ? "My Passport" : "Start Passport"}
                </Link>

                <a
                  href="https://instagram.com/passport.atl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display text-base tracking-[0.16em] uppercase inline-flex items-center gap-2 text-foreground/60 hover:text-foreground"
                >
                  <Instagram className="w-4 h-4" />
                  @passport.atl
                </a>

                {/* Language picker inside the menu (was cut off in header on small phones) */}
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
