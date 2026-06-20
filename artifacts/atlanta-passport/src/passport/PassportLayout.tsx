import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { PassportBottomNav } from "@/passport/PassportBottomNav";
import Footer from "@/components/layout/Footer";
import PrizesSection from "@/components/PrizesSection";

export function PassportLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const hidePrizes = location === "/passport/contact";
  return (
    <div className="min-h-screen bg-[hsl(var(--brand-cream))] text-foreground texture-paper">
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
      {!hidePrizes && <PrizesSection />}
      <Footer clearBottomNav />
      <PassportBottomNav />
    </div>
  );
}
