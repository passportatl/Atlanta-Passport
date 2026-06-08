import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Compass, Stamp as StampIcon, Map, Mail, User, Calendar, Menu, X, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { SocialLinks } from "@/components/SocialLinks";
import { basePath } from "@/auth/clerk";

// Contact opens in its own tab so the persistent map shell never reloads. Use
// window.open (not a plain link) so the contact tab is script-openable and can
// be closed again from its "Back to passport" button.
function openContactTab() {
  window.open(
    `${window.location.origin}${basePath}/passport/contact`,
    "_blank",
  );
}

const TABS = [
  { href: "/passport/explore", label: "Explore", icon: Compass, exact: true },
  { href: "/passport/routes", label: "Routes", icon: Map },
  { href: "/passport/explore/events", label: "Events", icon: Calendar },
  { href: "/passport/stamps", label: "Stamps", icon: StampIcon },
  { href: "/passport/contact", label: "Contact", icon: Mail },
  { href: "/passport", label: "Profile", icon: User, exact: true },
];

type Tab = (typeof TABS)[number];

function isActive(tab: Tab, location: string) {
  return tab.exact
    ? location === tab.href
    : location === tab.href || location.startsWith(tab.href + "/");
}

function renderTab(tab: Tab, location: string) {
  const active = isActive(tab, location);
  const Icon = tab.icon;
  const className = `group flex flex-col items-center justify-center py-2 text-[10px] font-black tracking-wider ${
    active ? "text-[#f9c629]" : "text-[#f9c629]/70 hover:text-[#f9c629]"
  }`;
  const inner = (
    <>
      <Icon className="w-5 h-5 mb-0.5" strokeWidth={2.5} />
      <span
        className={`transition-opacity duration-150 ${
          active ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
        }`}
      >
        {tab.label.toUpperCase()}
      </span>
    </>
  );

  // Contact opens in a new tab so the persistent map shell never reloads.
  if (tab.href === "/passport/contact") {
    return (
      <button
        key={tab.href}
        type="button"
        onClick={openContactTab}
        className={className}
        style={{ fontFamily: "Bungee, sans-serif" }}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      key={tab.href}
      href={tab.href}
      className={className}
      style={{ fontFamily: "Bungee, sans-serif" }}
    >
      {inner}
    </Link>
  );
}

export function PassportBottomNav() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  // The contact page opens in its own tab. Its nav strips every link except
  // Contact (the current page) and swaps in a "Back to passport" control that
  // closes the tab, sitting left of the logo where Explore normally lives.
  if (location === "/passport/contact") {
    return (
      <nav className="fixed bottom-0 inset-x-0 bg-[#a71930] border-t-4 border-foreground shadow-pop z-40">
        <div className="relative max-w-3xl mx-auto flex items-center gap-1 px-2 min-h-[56px]">
          <LanguageSwitcher
            align="start"
            className="w-16 justify-center md:w-auto md:justify-start"
          />

          <button
            type="button"
            onClick={() => window.close()}
            className="group flex flex-col items-center justify-center py-2 text-[10px] font-black tracking-wider text-[#f9c629]/80 hover:text-[#f9c629]"
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            <ArrowLeft className="w-5 h-5 mb-0.5" strokeWidth={2.5} />
            <span>BACK TO PASSPORT</span>
          </button>

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <Logo
              asLink={false}
              variant="nav"
              className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]"
            />
          </div>

          <div className="flex-1" />

          <div
            className="flex flex-col items-center justify-center py-2 text-[10px] font-black tracking-wider text-[#f9c629]"
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            <Mail className="w-5 h-5 mb-0.5" strokeWidth={2.5} />
            <span>CONTACT</span>
          </div>

          <div className="inline-flex h-10 px-1 items-center border-2 border-foreground bg-brand-cream rounded-xl shadow-[3px_3px_0_0_hsl(var(--foreground))]">
            <SocialLinks linkClassName="h-7 w-7 text-foreground/80 hover:text-brand-red hover:bg-foreground/10" />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Mobile menu backdrop */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}

      <nav className="fixed bottom-0 inset-x-0 bg-[#a71930] border-t-4 border-foreground shadow-pop z-40">
        {/* Mobile pop-up menu (above the bar) */}
        {menuOpen && (
          <div className="md:hidden absolute bottom-full inset-x-0 bg-[#a71930] border-t-4 border-foreground shadow-pop max-h-[90vh] overflow-y-auto">
            <div className="max-w-3xl mx-auto px-3 pt-3 pb-28">
              <div className="grid grid-cols-1 gap-1.5">
                {TABS.map((tab) => {
                  const active = isActive(tab, location);
                  const Icon = tab.icon;
                  const itemClass = `flex items-center gap-3 px-3 py-3 rounded-xl border-2 border-foreground text-sm font-black tracking-wider transition-colors ${
                    active
                      ? "bg-[#f9c629] text-foreground"
                      : "bg-[#a71930] text-[#f9c629] hover:bg-white/10"
                  }`;
                  // Contact opens in a new tab so the map shell never reloads.
                  if (tab.href === "/passport/contact") {
                    return (
                      <button
                        key={tab.href}
                        type="button"
                        onClick={() => {
                          openContactTab();
                          setMenuOpen(false);
                        }}
                        className={`${itemClass} text-left`}
                        style={{ fontFamily: "Bungee, sans-serif" }}
                      >
                        <Icon className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                        {tab.label.toUpperCase()}
                      </button>
                    );
                  }
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      onClick={() => setMenuOpen(false)}
                      className={itemClass}
                      style={{ fontFamily: "Bungee, sans-serif" }}
                    >
                      <Icon className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                      {tab.label.toUpperCase()}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-[#f9c629]/25 flex justify-center">
                <div className="px-1 inline-flex items-center border-2 border-foreground bg-brand-cream rounded-xl shadow-[3px_3px_0_0_hsl(var(--foreground))]">
                  <SocialLinks linkClassName="h-9 w-9 text-foreground/80 hover:text-brand-red hover:bg-foreground/10" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="relative max-w-3xl mx-auto flex items-center gap-1 px-2">
          <LanguageSwitcher
            align="start"
            className="w-16 justify-center md:w-auto md:justify-start"
          />

          {/* Mobile: logo centered against the whole bar (not the flex region) */}
          <Link
            href="/passport"
            aria-label="Atlanta Passport profile"
            className="md:hidden absolute bottom-0 left-1/2 -translate-x-1/2"
          >
            <Logo
              asLink={false}
              variant="nav"
              className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]"
            />
          </Link>

          {/* Desktop: full tab bar + social bubble */}
          <div className="hidden md:grid grid-cols-7 items-center flex-1 min-w-0">
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
          <div className="hidden md:inline-flex h-10 px-1 items-center border-2 border-foreground bg-brand-cream rounded-xl shadow-[3px_3px_0_0_hsl(var(--foreground))]">
            <SocialLinks linkClassName="h-7 w-7 text-foreground/80 hover:text-brand-red hover:bg-foreground/10" />
          </div>

          {/* Mobile: spacer pushes the hamburger to the right edge */}
          <div className="flex-1 md:hidden" />
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="md:hidden h-10 w-16 shrink-0 inline-flex items-center justify-center border-2 border-foreground bg-brand-cream text-foreground rounded-xl shadow-[3px_3px_0_0_hsl(var(--foreground))]"
          >
            {menuOpen ? <X className="w-5 h-5" strokeWidth={2.5} /> : <Menu className="w-5 h-5" strokeWidth={2.5} />}
          </button>
        </div>
      </nav>
    </>
  );
}
