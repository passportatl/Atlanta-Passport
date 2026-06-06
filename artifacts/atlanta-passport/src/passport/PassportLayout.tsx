import type { ReactNode } from "react";
import { PassportBottomNav } from "@/passport/PassportBottomNav";
import LegalDisclaimer from "@/components/LegalDisclaimer";

export function PassportLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[hsl(var(--brand-cream))] text-foreground texture-paper">
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
      <LegalDisclaimer />
      <PassportBottomNav />
    </div>
  );
}
