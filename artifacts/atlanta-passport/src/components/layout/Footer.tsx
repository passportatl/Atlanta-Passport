import { Link } from "wouter";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="md:col-span-2 space-y-5">
            <Logo variant="stacked" />
            <p className="font-serif text-xl text-brand-yellow max-w-sm leading-snug">
              The unofficial guide to the real Atlanta.
            </p>
            <p className="text-background/80 max-w-sm">
              Built by local Atlanta entrepreneurs.
            </p>
            <p className="text-background/80">
              Founding Sponsor: <span className="font-display text-brand-yellow tracking-wider">WHEELHAUS BIKES</span>
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Directory</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/beltline" className="text-background/80 hover:text-brand-yellow transition-colors">
                  Beltline Tour
                </Link>
              </li>
              <li>
                <Link href="/explore" className="text-background/80 hover:text-brand-yellow transition-colors">
                  Explore
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-background/80 hover:text-brand-yellow transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-background/80 hover:text-brand-yellow transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-lg">Partner</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/partners" className="text-background/80 hover:text-brand-yellow transition-colors">
                  Why Join?
                </Link>
              </li>
              <li>
                <Link href="/apply" className="text-background/80 hover:text-brand-yellow transition-colors">
                  Apply Now
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-background/20 text-sm text-background/60">
          <p>
            Atlanta Passport is an independent local guide and is not affiliated with FIFA, the official World Cup, or any professional sports team.
          </p>
          <p className="mt-2">
            &copy; {new Date().getFullYear()} Atlanta Passport. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
