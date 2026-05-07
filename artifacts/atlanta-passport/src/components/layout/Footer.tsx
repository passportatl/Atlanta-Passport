import { Link } from "wouter";
import Logo from "@/components/Logo";
import Sticker from "@/components/Sticker";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background pt-14 pb-10 md:pt-20 md:pb-14 relative overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-[0.06] pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12">
          <div className="md:col-span-5 space-y-5">
            <Logo variant="stacked" />
            <p className="font-serif text-xl md:text-2xl text-brand-yellow max-w-sm leading-snug">
              The unofficial guide to the real Atlanta.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Sticker color="yellow">★ Local Picks</Sticker>
              <Sticker color="red">Match Day Moves</Sticker>
              <Sticker color="lime">Beltline</Sticker>
            </div>
            <p className="text-background/75 max-w-sm pt-2">
              Built by local Atlanta entrepreneurs.
            </p>
          </div>

          <div className="md:col-span-3 space-y-4">
            <h4 className="font-display text-xs tracking-[0.18em] text-brand-yellow uppercase">
              Explore
            </h4>
            <ul className="space-y-3">
              {[
                ["/explore", "All Spots"],
                ["/beltline", "Beltline Tour"],
                ["/events", "Events"],
                ["/about", "About"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-background/80 hover:text-brand-yellow transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Separated business mini-section */}
          <div className="md:col-span-4">
            <div className="bg-background/[0.04] border border-background/15 rounded-2xl p-5 space-y-4">
              <div className="font-display text-[10px] tracking-[0.22em] uppercase text-brand-yellow/90">
                ★ For Businesses
              </div>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/apply"
                    className="text-background/85 hover:text-brand-yellow transition-colors"
                  >
                    Get listed in Atlanta Passport →
                  </Link>
                </li>
                <li>
                  <Link
                    href="/partners"
                    className="text-background/85 hover:text-brand-yellow transition-colors"
                  >
                    Sponsor a route →
                  </Link>
                </li>
                <li>
                  <Link
                    href="/partners"
                    className="text-background/85 hover:text-brand-yellow transition-colors"
                  >
                    Request partnership info →
                  </Link>
                </li>
              </ul>
              <p className="text-xs text-background/55 leading-snug pt-1">
                Founding sponsor: <span className="font-display text-brand-yellow tracking-wider">WHEELHAUS BIKES</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-background/15 text-xs text-background/55 leading-relaxed space-y-2 max-w-3xl">
          <p>
            Atlanta Passport is an independent local guide and is not affiliated with FIFA, the
            official World Cup, Waffle House, Coca-Cola, or any professional sports team. All brand
            names are the property of their respective owners.
          </p>
          <p>&copy; {new Date().getFullYear()} Atlanta Passport. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
