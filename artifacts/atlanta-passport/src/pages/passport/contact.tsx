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
      </div>

      <ContactForm doneHref="/passport" doneLabel="Back to passport" />
    </div>
  );
}
