import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, MoveRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

const navItemClass = (active: boolean) =>
  cn(
    "font-display text-[11px] tracking-[0.16em] uppercase transition-colors px-2 py-1 rounded-md",
    active
      ? "text-foreground bg-brand-yellow/40"
      : "text-foreground/70 hover:text-foreground"
  );

const touristLinks = [
  { name: "Explore", path: "/explore" },
  { name: "Beltline Tour", path: "/beltline" },
  { name: "Events", path: "/events" },
  { name: "About", path: "/about" },
];

const mobileTouristLinks = [
  { name: "Explore", path: "/explore" },
  { name: "Beltline Tour", path: "/beltline" },
  { name: "Neighborhoods", path: "/explore" },
  { name: "Local Spots", path: "/explore" },
  { name: "Events", path: "/events" },
  { name: "About", path: "/about" },
];

const businessLinks = [
  { name: "Get Listed", path: "/apply" },
  { name: "Partner Tiers", path: "/partners" },
];

export default function Navbar() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b-[3px] border-foreground bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Logo />

        {/* Desktop Nav — tourist-first */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/" className={navItemClass(location === "/")}>Home</Link>
          {touristLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={navItemClass(location === link.path)}
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/explore"
            className="button-pop button-pop-yellow ml-4 text-xs px-5 py-2.5"
          >
            Explore <MoveRight className="w-4 h-4" />
          </Link>
        </nav>

        {/* Mobile Nav — tourist CTA + menu */}
        <div className="md:hidden flex items-center gap-2">
          <Link
            href="/explore"
            className="button-pop button-pop-yellow text-[10px] px-3 py-2"
          >
            Explore
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 border-2 border-foreground bg-brand-cream text-foreground rounded-xl shadow-[3px_3px_0_0_hsl(var(--foreground))] hover:bg-brand-cream"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
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
                  Home
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
              </div>

              {/* Separated business section */}
              <div className="mt-auto bg-brand-cream border-t-[3px] border-foreground px-6 py-7 space-y-4">
                <div className="font-display text-[10px] tracking-[0.22em] uppercase text-foreground/60">
                  ★ For Businesses
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
