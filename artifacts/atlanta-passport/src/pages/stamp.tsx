import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetBusinessBySlug,
  useCollectStamp,
  getListVisitorStampsQueryKey,
  type Business,
  type StampCollection,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useVisitor } from "@/passport/visitor-context";
import { StartPassportForm } from "@/passport/StartPassportForm";
import { StampGraphic } from "@/passport/StampGraphic";
import { CheckCircle2, MapPin } from "lucide-react";

export default function StampPage() {
  const params = useParams<{ businessSlug: string }>();
  const slug = params.businessSlug ?? "";
  const { visitorId, visitor } = useVisitor();
  const queryClient = useQueryClient();

  const { data: businessData, isLoading: loadingBiz, error: bizError } = useGetBusinessBySlug(slug);
  const business = businessData as Business | undefined;

  const { mutateAsync: collect, isPending } = useCollectStamp();
  const [result, setResult] = useState<StampCollection | null>(null);
  const [collectErr, setCollectErr] = useState<string | null>(null);
  const inFlightKey = useRef<string | null>(null);

  // Auto-collect once we have both a visitor and a business (guard against double-fire)
  useEffect(() => {
    if (!visitorId || !business || result) return;
    const key = `${visitorId}:${business.slug}`;
    if (inFlightKey.current === key) return;
    inFlightKey.current = key;
    let cancelled = false;
    (async () => {
      try {
        const r = (await collect({
          data: { visitorId, businessSlug: business.slug },
        })) as StampCollection;
        if (cancelled) return;
        setResult(r);
        queryClient.invalidateQueries({ queryKey: getListVisitorStampsQueryKey(visitorId) });
      } catch {
        if (!cancelled) setCollectErr("Could not collect stamp. Please try again.");
      } finally {
        if (inFlightKey.current === key) inFlightKey.current = null;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visitorId, business, result, collect, queryClient]);

  if (loadingBiz) {
    return (
      <div className="min-h-screen grid place-items-center bg-[hsl(var(--brand-cream))] texture-paper">
        <div className="text-sm font-bold opacity-60">Loading…</div>
      </div>
    );
  }

  if (bizError || !business) {
    return (
      <div className="min-h-screen grid place-items-center bg-[hsl(var(--brand-cream))] texture-paper p-6 text-center">
        <div className="card-pop bg-white p-8 max-w-md">
          <h1 className="text-2xl font-black mb-2" style={{ fontFamily: "Bungee, sans-serif" }}>
            Stamp not found
          </h1>
          <p className="text-sm text-foreground/70 mb-4">
            We couldn't find a business with that link.
          </p>
          <Link href="/passport" className="button-pop button-pop-yellow inline-block">
            Open my passport
          </Link>
        </div>
      </div>
    );
  }

  if (!visitorId) {
    return (
      <div className="min-h-screen bg-[hsl(var(--brand-cream))] texture-paper py-10 px-4">
        <div className="max-w-md mx-auto mb-6 text-center">
          <div
            className="inline-block bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-yellow-foreground))] border-2 border-foreground px-3 py-1 text-xs font-black tracking-widest mb-3"
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            COLLECT YOUR FIRST STAMP
          </div>
          <h1 className="text-3xl font-black mb-1" style={{ fontFamily: "Bungee, sans-serif" }}>
            {business.name}
          </h1>
          <div className="flex items-center justify-center gap-1 text-sm text-foreground/70">
            <MapPin className="w-4 h-4" /> {business.neighborhood}
          </div>
        </div>
        <StartPassportForm
          title="Start Your Passport"
          subtitle="Create a passport in 10 seconds, then collect this stamp."
        />
      </div>
    );
  }

  if (collectErr) {
    return (
      <div className="min-h-screen grid place-items-center bg-[hsl(var(--brand-cream))] texture-paper p-6 text-center">
        <div className="card-pop bg-white p-8 max-w-md">
          <h1 className="text-xl font-black mb-2">Couldn't collect</h1>
          <p className="text-sm text-foreground/70 mb-4">{collectErr}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen grid place-items-center bg-[hsl(var(--brand-cream))] texture-paper">
        <div className="text-sm font-bold opacity-60">{isPending ? "Stamping…" : "Loading…"}</div>
      </div>
    );
  }

  const already = result.alreadyCollected;

  return (
    <div className="min-h-screen bg-[hsl(var(--brand-cream))] texture-paper py-10 px-4">
      <div className="max-w-md mx-auto text-center">
        <div
          className={`inline-flex items-center gap-1 px-3 py-1 border-2 border-foreground text-xs font-black tracking-widest mb-3 ${
            already
              ? "bg-[hsl(var(--brand-cream))]"
              : "bg-[hsl(var(--brand-lime))]"
          }`}
          style={{ fontFamily: "Bungee, sans-serif" }}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {already ? "STAMP ALREADY COLLECTED" : "STAMP COLLECTED!"}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-1" style={{ fontFamily: "Bungee, sans-serif" }}>
          {business.name}
        </h1>
        <div className="flex items-center justify-center gap-1 text-sm text-foreground/70 mb-6">
          <MapPin className="w-4 h-4" /> {business.neighborhood}
        </div>

        <div className="flex justify-center mb-6">
          <StampGraphic
            neighborhood={business.neighborhood}
            iconName={business.icon}
            color={business.stampColor}
            collectedAt={result.stamp.collectedAt as unknown as string}
            size={220}
          />
        </div>

        {visitor && (
          <p className="text-sm text-foreground/70 mb-6">
            Nice work, <span className="font-black">{visitor.firstName}</span> — this stamp is in
            your passport.
          </p>
        )}

        <div className="grid grid-cols-1 sm:flex gap-3 justify-center">
          <Link href="/passport" className="button-pop button-pop-yellow">
            View my passport
          </Link>
          <Link href="/explore" className="button-pop button-pop-cream">
            Keep exploring
          </Link>
        </div>
      </div>
    </div>
  );
}
