import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
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
        <h1 className="text-3xl sm:text-4xl font-black mb-1" style={{ fontFamily: "Bungee, sans-serif" }}>
          Contact Us
        </h1>
        <p className="text-sm text-foreground/70">
          Questions, ideas, or a spot we should add? Send us a note — we'd love to hear from you.
        </p>
        <p className="text-sm text-foreground/70 mt-4">
          If you're interested in having your event or venue featured, or advertising with us, please visit our partners page.
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <Link
            href="/partners"
            className="button-pop button-pop-yellow inline-flex items-center gap-2"
          >
            Partners Page
            <ArrowRight className="w-5 h-5 rtl:rotate-180" />
          </Link>
          <Link
            href="/list-event"
            className="button-pop inline-flex items-center gap-2"
          >
            List an Event
            <ArrowRight className="w-5 h-5 rtl:rotate-180" />
          </Link>
        </div>
      </div>

      <ContactForm doneHref="/passport" doneLabel="Back to passport" />
    </div>
  );
}
