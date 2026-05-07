import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-serif text-2xl font-bold">Atlanta Passport</h3>
            <p className="font-serif text-xl text-secondary max-w-sm leading-snug">
              The unofficial guide to the real Atlanta.
            </p>
            <p className="text-primary-foreground/80 max-w-sm">
              Built by local Atlanta entrepreneurs.
            </p>
            <p className="text-primary-foreground/80">
              Founding Sponsor: <span className="font-medium text-secondary">Wheelhaus Bikes</span>
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Directory</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/beltline" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Beltline Tour
                </Link>
              </li>
              <li>
                <Link href="/explore" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Explore
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-lg">Partner</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/partners" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Why Join?
                </Link>
              </li>
              <li>
                <Link href="/apply" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Apply Now
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/20 text-sm text-primary-foreground/60">
          <p>
            Atlanta Passport is an independent local guide and is not affiliated with FIFA or the official World Cup.
          </p>
          <p className="mt-2">
            &copy; {new Date().getFullYear()} Atlanta Passport. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
