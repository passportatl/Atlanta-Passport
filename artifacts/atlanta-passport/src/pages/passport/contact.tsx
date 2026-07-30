import { Link } from "wouter";
import { ArrowRight, CalendarPlus, MapPinned } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";

export default function PassportContact() {
  return (
    <div className="space-y-6">
      <div>
        <div
          className="inline-block bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-yellow-foreground))] border-2 border-foreground px-3 py-1 text-xs font-black tracking-widest mb-3"
          style={{ fontFamily: "Bungee, sans-serif" }}
        >
          GET IN TOUCH
        </div>
        <h1
          className="text-3xl sm:text-4xl font-black mb-1"
          style={{ fontFamily: "Bungee, sans-serif" }}
        >
          Contact Us / Become a Partner
        </h1>
        <p className="text-sm text-foreground/70">
          Have a question, need support, or want to work with Passport ATL?
          Choose the reason that best fits and our team will route your message
          to the right person.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 mt-5">
          <div className="card-pop bg-brand-yellow p-5">
            <MapPinned className="h-7 w-7 mb-3" aria-hidden="true" />
            <h2 className="font-black text-lg mb-2">List a location</h2>
            <p className="text-sm leading-relaxed mb-4">
              Apply to add a restaurant, attraction, shop, venue, or other
              Atlanta destination. Start with the listing option that fits your
              needs and provide the content for that package.
            </p>
            <Link
              href="/partners"
              className="button-pop inline-flex items-center gap-2"
            >
              Start location submission
              <ArrowRight className="w-5 h-5 rtl:rotate-180" />
            </Link>
          </div>

          <div className="card-pop bg-card p-5">
            <CalendarPlus className="h-7 w-7 mb-3" aria-hidden="true" />
            <h2 className="font-black text-lg mb-2">List an event for free</h2>
            <p className="text-sm leading-relaxed mb-4">
              Every approved event can receive a free basic calendar listing.
              Paid packages and add-ons are available when you want more
              details, media, or promotional visibility.
            </p>
            <Link
              href="/list-event"
              className="button-pop button-pop-yellow inline-flex items-center gap-2"
            >
              Submit an event
              <ArrowRight className="w-5 h-5 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>

      <ContactForm doneHref="/passport" doneLabel="Back to passport" />
    </div>
  );
}
