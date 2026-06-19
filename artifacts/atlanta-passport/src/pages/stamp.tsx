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
import { useUser } from "@clerk/react";
import { useVisitor, PENDING_STAMP_KEY } from "@/passport/visitor-context";
import { StartPassportForm } from "@/passport/StartPassportForm";
import { StampGraphic } from "@/passport/StampGraphic";
import { STAMP_IMAGE_BY_SLUG } from "@/data/sample-data";
import { ApiError } from "@workspace/api-client-react";
import { getCurrentPosition, geoErrorCode, type Coords } from "@/lib/geo";
import { CheckCircle2, MapPin, Navigation } from "lucide-react";

export default function StampPage() {
  const params = useParams<{ businessSlug: string }>();
  const slug = params.businessSlug ?? "";
  const { visitorId, visitor, linkedReady } = useVisitor();
  const { isLoaded: authLoaded, isSignedIn } = useUser();
  const queryClient = useQueryClient();

  const { data: businessData, isLoading: loadingBiz, error: bizError } = useGetBusinessBySlug(slug);
  const business = businessData as Business | undefined;

  const { mutateAsync: collect, isPending } = useCollectStamp();
  const [result, setResult] = useState<StampCollection | null>(null);
  const [collectErr, setCollectErr] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const inFlightKey = useRef<string | null>(null);

  // A business carries lat/lng only when it's an in-scope geofenced spot
  // (sponsor offer or bonus event). Those require the visitor's location.
  const geofenced =
    !!business && business.latitude != null && business.longitude != null;

  // Auto-collect once the visitor is signed in (Clerk) AND their passport is
  // linked AND the business is loaded (guard against double-fire). Gating on
  // isSignedIn ensures a stale/anonymous localStorage visitorId can never
  // collect into a non-account passport.
  useEffect(() => {
    if (!isSignedIn || !linkedReady || !visitorId || !business || result) return;
    if (geoError) return; // wait for the user to retry
    const key = `${visitorId}:${business.slug}:${retryNonce}`;
    if (inFlightKey.current === key) return;
    inFlightKey.current = key;
    let cancelled = false;
    (async () => {
      try {
        let coords: Coords | null = null;
        // Geofenced spots need the device location. Resolve it BEFORE the
        // collect call so the server can verify proximity.
        if (geofenced) {
          try {
            coords = await getCurrentPosition();
          } catch (e) {
            if (cancelled) return;
            setGeoError(geoErrorCode(e));
            return;
          }
        }
        if (cancelled) return;
        const r = (await collect({
          data: {
            visitorId,
            businessSlug: business.slug,
            ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
          },
        })) as StampCollection;
        if (cancelled) return;
        setResult(r);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(PENDING_STAMP_KEY);
        }
        queryClient.invalidateQueries({ queryKey: getListVisitorStampsQueryKey(visitorId) });
      } catch (e) {
        if (cancelled) return;
        // Server-side geofence rejections (422) get a location-specific retry UI;
        // everything else is a generic failure.
        if (e instanceof ApiError && e.status === 422) {
          const errCode =
            e.data && typeof e.data === "object" && "error" in e.data
              ? String((e.data as { error?: unknown }).error)
              : "";
          setGeoError(errCode === "too_far" ? "too_far" : "location_required");
          return;
        }
        setCollectErr("Could not collect stamp. Please try again.");
        // Drop the pending marker so a hard failure can't trap the visitor in a
        // redirect loop back to this stamp; they can rescan to retry.
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(PENDING_STAMP_KEY);
        }
      } finally {
        if (inFlightKey.current === key) inFlightKey.current = null;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    isSignedIn,
    linkedReady,
    visitorId,
    business,
    result,
    collect,
    queryClient,
    geofenced,
    geoError,
    retryNonce,
  ]);

  // Remember which stamp a signed-out visitor is trying to collect, so that
  // after they sign in (via the hosted login page, or a social login that lands
  // on another page) PendingStampRedirect can send them straight back here.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (business && authLoaded && !isSignedIn && !result) {
      window.localStorage.setItem(PENDING_STAMP_KEY, business.slug);
    }
  }, [business, authLoaded, isSignedIn, result]);

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

  if (!authLoaded) {
    return (
      <div className="min-h-screen grid place-items-center bg-[hsl(var(--brand-cream))] texture-paper">
        <div className="text-sm font-bold opacity-60">Loading…</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[hsl(var(--brand-cream))] texture-paper py-10 px-4">
        <div className="max-w-md mx-auto mb-6 text-center">
          <div
            className="inline-block bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-yellow-foreground))] border-2 border-foreground px-3 py-1 text-xs font-black tracking-widest mb-3"
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            COLLECT THIS STAMP
          </div>
          <h1 className="text-3xl font-black mb-1" style={{ fontFamily: "Bungee, sans-serif" }}>
            {business.name}
          </h1>
          <div className="flex items-center justify-center gap-1 text-sm text-foreground/70">
            <MapPin className="w-4 h-4" /> {business.neighborhood}
          </div>
        </div>

        <div className="max-w-md mx-auto mb-5">
          <p className="text-center text-sm font-bold text-foreground/70 mb-3">
            Already have a passport? Log in to add this stamp to your account.
          </p>
          <Link
            href="/sign-in"
            className="button-pop button-pop-yellow block w-full text-center"
          >
            Log in to collect
          </Link>
          <div className="flex items-center gap-3 my-5 text-[0.7rem] font-black uppercase tracking-widest text-foreground/45">
            <span className="h-px flex-1 bg-foreground/20" />
            New here? Create a passport
            <span className="h-px flex-1 bg-foreground/20" />
          </div>
        </div>

        <StartPassportForm
          title="Start Your Passport"
          subtitle="Create a passport in 10 seconds, then collect this stamp."
        />
      </div>
    );
  }

  if (geoError) {
    const copy: Record<string, { title: string; body: string }> = {
      too_far: {
        title: "You're not there yet",
        body: `This stamp can only be collected at ${business.name}. Head to ${business.neighborhood} and tap retry.`,
      },
      location_required: {
        title: "Location needed",
        body: "We need your location to confirm you're at this spot. Turn on location and retry.",
      },
      denied: {
        title: "Location is off",
        body: "Allow location access in your browser so we can confirm you're here, then retry.",
      },
      timeout: {
        title: "Couldn't get your location",
        body: "Getting your location took too long. Make sure location is on and retry.",
      },
      unavailable: {
        title: "Location unavailable",
        body: "Your device couldn't share a location. Check your settings and retry.",
      },
    };
    const c = copy[geoError] ?? copy.unavailable;
    return (
      <div className="min-h-screen grid place-items-center bg-[hsl(var(--brand-cream))] texture-paper p-6 text-center">
        <div className="card-pop bg-white p-8 max-w-md">
          <div className="flex justify-center mb-3">
            <Navigation className="w-10 h-10 text-[hsl(var(--brand-red))]" />
          </div>
          <h1 className="text-xl font-black mb-2" style={{ fontFamily: "Bungee, sans-serif" }}>
            {c.title}
          </h1>
          <p className="text-sm text-foreground/70 mb-5">{c.body}</p>
          <button
            type="button"
            onClick={() => {
              setGeoError(null);
              setRetryNonce((n) => n + 1);
            }}
            className="button-pop button-pop-yellow w-full"
          >
            Retry
          </button>
        </div>
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
            iconUrl={STAMP_IMAGE_BY_SLUG[business.slug]}
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
          <Link href="/passport/explore" className="button-pop button-pop-cream">
            Keep exploring
          </Link>
        </div>
      </div>
    </div>
  );
}
