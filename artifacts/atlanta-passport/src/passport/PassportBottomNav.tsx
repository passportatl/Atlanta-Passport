import { Link, useLocation } from "wouter";
import { Compass, Stamp as StampIcon, Map, Mail, User, Calendar } from "lucide-react";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { SocialLinks } from "@/components/SocialLinks";

const TABS = [
  { href: "/explore", label: "Explore", icon: Compass, exact: true },
  { href: "/passport/routes", label: "Routes", icon: Map },
  { href: "/explore/events", label: "Events", icon: Calendar },
  { href: "/passport/stamps", label: "Stamps", icon: StampIcon },
  { href: "/passport/contact", label: "Contact", icon: Mail },
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
      className={`group flex flex-col items-center justify-center py-2 text-[10px] font-black tracking-wider ${
        active
          ? "text-[#f9c629]"
          : "text-[#f9c629]/70 hover:text-[#f9c629]"
      }`}
      style={{ fontFamily: "Bungee, sans-serif" }}
    >
      <Icon className="w-5 h-5 mb-0.5" strokeWidth={2.5} />
      <span
        className={`transition-opacity duration-150 ${
          active ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
        }`}
      >
        {tab.label.toUpperCase()}
      </span>
    </Link>
  );
}

export function PassportBottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-[#a71930] border-t-4 border-foreground shadow-pop z-40">
      {/* Utility strip: language (left) + socials (right) */}
      <div className="border-b border-[#f9c629]/20">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-3 py-1.5">
          <LanguageSwitcher align="start" />
          <SocialLinks linkClassName="text-[#f9c629]/80 hover:text-[#f9c629] hover:bg-white/10" />
        </div>
      </div>

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
  );
}
