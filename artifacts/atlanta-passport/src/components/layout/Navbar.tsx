import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

const navItemClass = (active: boolean) =>
  cn(
    "font-display text-[11px] tracking-[0.16em] uppercase transition-colors px-2 py-1 rounded-md",
    active
      ? "text-foreground bg-brand-yellow/40"
      : "text-foreground/70 hover:text-foreground"
  );

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Beltline Tour", path: "/beltline" },
  { name: "Explore", path: "/explore" },
  { name: "Partners", path: "/partners" },
  { name: "Events", path: "/events" },
  { name: "About", path: "/about" },
];

export default function Navbar() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b-[3px] border-foreground bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo />
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={navItemClass(location === link.path)}
            >
              {link.name}
            </Link>
          ))}
          <Link href="/apply" className="button-pop ml-4 text-xs px-5 py-2.5">
            Apply Now
          </Link>
        </nav>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center gap-2">
          <Link href="/apply" className="button-pop text-[10px] px-3 py-2">
            Apply
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 border-2 border-foreground bg-brand-yellow text-foreground rounded-xl shadow-[3px_3px_0_0_hsl(var(--foreground))] hover:bg-brand-yellow"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col bg-paper">
              <div className="flex flex-col gap-6 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={cn(
                      "font-display text-base tracking-[0.16em] uppercase",
                      location === link.path ? "text-foreground" : "text-foreground/60"
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
                <Link href="/apply" className="button-pop mt-4 justify-center">
                  Apply Now
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
