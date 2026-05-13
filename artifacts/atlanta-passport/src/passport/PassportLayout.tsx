import { Link, useLocation } from "wouter";
import { Home, Stamp as StampIcon, Map, Trophy, User } from "lucide-react";
import type { ReactNode } from "react";

const TABS = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/passport/stamps", label: "Stamps", icon: StampIcon },
  { href: "/passport/routes", label: "Routes", icon: Map },
  { href: "/passport/rewards", label: "Rewards", icon: Trophy },
  { href: "/passport", label: "Profile", icon: User, exact: true },
];

export function PassportLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-[hsl(var(--brand-cream))] text-foreground texture-paper pb-24">
      <header className="bg-[hsl(var(--brand-navy))] text-[hsl(var(--brand-cream))] border-b-4 border-foreground">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/passport" className="flex items-center gap-2">
            <span
              className="bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-yellow-foreground))] border-2 border-foreground px-2 py-1 font-black text-xs tracking-widest"
              style={{ fontFamily: "Bungee, sans-serif" }}
            >
              PASSPORT
            </span>
            <span className="font-black text-xs tracking-widest" style={{ fontFamily: "Bungee, sans-serif" }}>
              ATL
            </span>
          </Link>
          <Link href="/" className="text-xs underline opacity-80 hover:opacity-100">
            Back to site
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 bg-[hsl(var(--brand-cream))] border-t-4 border-foreground shadow-pop z-40">
        <div className="max-w-3xl mx-auto grid grid-cols-5">
          {TABS.map((tab) => {
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
                    ? "text-[hsl(var(--brand-red))]"
                    : "text-foreground/70 hover:text-foreground"
                }`}
                style={{ fontFamily: "Bungee, sans-serif" }}
              >
                <Icon className="w-5 h-5 mb-0.5" strokeWidth={2.5} />
                {tab.label.toUpperCase()}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
