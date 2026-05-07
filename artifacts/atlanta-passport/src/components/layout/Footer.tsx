import { Link } from "wouter";
import Logo from "@/components/Logo";
import Sticker from "@/components/Sticker";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background pt-14 pb-10 md:pt-20 md:pb-14 relative overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-[0.06] pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12">
          <div className="md:col-span-2 space-y-5">
            <Logo variant="stacked" />
            <p className="font-serif text-xl md:text-2xl text-brand-yellow max-w-sm leading-snug">
              The unofficial guide to the real Atlanta.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Sticker color="yellow" rotate="left">★ Local Picks</Sticker>
              <Sticker color="red" rotate="right">Match Day Moves</Sticker>
              <Sticker color="lime" rotate="left">Beltline</Sticker>
            </div>
            <p className="text-background/75 max-w-sm pt-2">
              Built by local Atlanta entrepreneurs.
            </p>
            <p className="text-background/80">
              Founding Sponsor:{" "}
              <span className="font-display text-brand-yellow tracking-wider">
                WHEELHAUS BIKES
              </span>
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-display text-xs tracking-[0.18em] text-brand-yellow uppercase">
              Directory
            </h4>
            <ul className="space-y-3">
              {[
                ["/beltline", "Beltline Tour"],
                ["/explore", "Explore"],
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

          <div className="space-y-4">
            <h4 className="font-display text-xs tracking-[0.18em] text-brand-yellow uppercase">
              Partner
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/partners"
                  className="text-background/80 hover:text-brand-yellow transition-colors"
                >
                  Why Join?
                </Link>
              </li>
              <li>
                <Link
                  href="/apply"
                  className="text-background/80 hover:text-brand-yellow transition-colors"
                >
                  Apply Now
                </Link>
              </li>
            </ul>
            <Link href="/apply" className="button-pop button-pop-yellow text-xs mt-3 inline-flex">
              Apply →
            </Link>
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
