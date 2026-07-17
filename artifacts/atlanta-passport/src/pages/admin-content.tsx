import AdminNav from "@/components/AdminNav";

export default function AdminContent() {
  return (
    <div className="min-h-screen bg-[hsl(var(--brand-cream))] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <AdminNav />

        <div className="border-2 border-foreground rounded-2xl bg-white shadow-pop overflow-hidden">
          <div className="p-6 border-b-2 border-foreground bg-[hsl(var(--brand-navy))] text-[hsl(var(--brand-cream))]">
            <h1
              className="text-2xl font-black tracking-tight"
              style={{ fontFamily: "Bungee, sans-serif" }}
            >
              CONTENT HUB
            </h1>
            <p className="text-sm opacity-70 mt-1">
              Manage ATL Legends blog posts and Passport Experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-0 divide-y-2 md:divide-y-0 md:divide-x-2 divide-foreground">
            <div className="p-6 space-y-3">
              <h2
                className="text-lg font-black tracking-wide uppercase"
                style={{ fontFamily: "Bungee, sans-serif" }}
              >
                ATL Legends
              </h2>
              <p className="text-sm text-foreground/70">
                Stories about Atlanta's iconic people, places, and culture.
              </p>
              <div className="rounded-xl border-2 border-dashed border-foreground/30 p-6 text-center text-sm text-foreground/50">
                Coming soon — blog post management
              </div>
            </div>

            <div className="p-6 space-y-3">
              <h2
                className="text-lg font-black tracking-wide uppercase"
                style={{ fontFamily: "Bungee, sans-serif" }}
              >
                Passport Experiences
              </h2>
              <p className="text-sm text-foreground/70">
                Curated multi-stop itineraries tied to the passport.
              </p>
              <div className="rounded-xl border-2 border-dashed border-foreground/30 p-6 text-center text-sm text-foreground/50">
                Coming soon — experience management
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
