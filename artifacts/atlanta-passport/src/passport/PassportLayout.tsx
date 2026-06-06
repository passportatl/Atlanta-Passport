import { Link, useLocation } from "wouter";
import { Home, Stamp as StampIcon, Map, Trophy, User, Calendar } from "lucide-react";
import type { ReactNode } from "react";
import Logo from "@/components/Logo";

const TABS = [
  { href: "/", label: "Back to site", icon: Home, exact: true },
  { href: "/passport/stamps", label: "Stamps", icon: StampIcon },
  { href: "/passport/routes", label: "Routes", icon: Map },
  { href: "/passport/rewards", label: "Rewards", icon: Trophy },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/passport", label: "Profile", icon: User, exact: true },
];

type Tab = (typeof TABS)[number];

function renderTab(tab: Tab, location: string) {
  const active = tab.exact
    ? location === tab.href
    : location === tab.href || location.startsWith(tab.href + "/");
  const Icon = tab.icon;
  return (
    <Link
      key={tab.href}
      href={tab.href}
      className={`flex flex-col items-center justify-center py-2 text-[10px] font-black tracking-wider ${
        active
          ? "text-[#f9c629]"
          : "text-[#f9c629]/70 hover:text-[#f9c629]"
      }`}
      style={{ fontFamily: "Bungee, sans-serif" }}
    >
      <Icon className="w-5 h-5 mb-0.5" strokeWidth={2.5} />
      {tab.label.toUpperCase()}
    </Link>
  );
}

export function PassportLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-[hsl(var(--brand-cream))] text-foreground texture-paper pb-24">
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 bg-[#a71930] border-t-4 border-foreground shadow-pop z-40">
        <div className="max-w-3xl mx-auto grid grid-cols-7 items-center">
          {TABS.slice(0, 3).map((tab) => renderTab(tab, location))}
          <Link
            href="/passport"
            aria-label="Atlanta Passport profile"
            className="relative flex items-center justify-center self-stretch"
          >
            <Logo
              asLink={false}
              variant="nav"
              className="absolute bottom-2 left-1/2 -translate-x-1/2 drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]"
            />
          </Link>
          {TABS.slice(3).map((tab) => renderTab(tab, location))}
        </div>
      </nav>
    </div>
  );
}
