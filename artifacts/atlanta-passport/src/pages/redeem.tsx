import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import {
  useRedeemPrize,
  getListVisitorRedemptionsQueryKey,
  ApiError,
  type RedeemPrizeResult,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { useVisitor } from "@/passport/visitor-context";
import { PRIZE_TIERS } from "@/components/PrizesSection";
import { getCurrentPosition, geoErrorCode } from "@/lib/geo";
import { CheckCircle2, Navigation, Gift } from "lucide-react";

// Staff-facing prize redemption target. One printed QR per prize tier lives at
// the Peachtree Wellness front desk; a signed-in visitor scans it to redeem.
// The server location-locks the redemption to Peachtree Wellness and spends the
// tier's stamp cost from the visitor's effective balance (one redemption / tier).
export default function RedeemPage() {
  const params = useParams<{ tier: string }>();
  const tier = Number(params.tier);
  const tierDef = PRIZE_TIERS.find((t) => t.stamps === tier);

  const { visitorId, linkedReady } = useVisitor();
  const { isLoaded: authLoaded, isSignedIn } = useUser();
  const queryClient = useQueryClient();

  const { mutateAsync: redeem, isPending } = useRedeemPrize();
  const [result, setResult] = useState<RedeemPrizeResult | null>(null);
  const [errCode, setErrCode] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const inFlight = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !linkedReady || !visitorId || !tierDef || result) return;
    if (errCode) return; // wait for retry
    const key = `${visitorId}:${tier}:${retryNonce}`;
    if (inFlight.current === key) return;
    inFlight.current = key;
    let cancelled = false;
    (async () => {
      try {
        let coords;
        try {
          coords = await getCurrentPosition();
        } catch (e) {
          if (cancelled) return;
          setErrCode(geoErrorCode(e));
          return;
        }
        const r = (await redeem({
          data: {
            visitorId,
            tier,
            latitude: coords.latitude,
            longitude: coords.longitude,
          },
        })) as RedeemPrizeResult;
        if (cancelled) return;
        setResult(r);
        queryClient.invalidateQueries({
          queryKey: getListVisitorRedemptionsQueryKey(visitorId),
        });
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError) {
          if (e.status === 409) {
            setErrCode("already");
            return;
          }
          if (e.status === 422) {
            const code =
              e.data && typeof e.data === "object" && "error" in e.data
                ? String((e.data as { error?: unknown }).error)
                : "";
            setErrCode(
              code === "too_far"
                ? "too_far"
                : code === "insufficient_stamps"
                  ? "insufficient"
                  : "location_required",
            );
            return;
          }
        }
        setErrCode("failed");
      } finally {
        if (inFlight.current === key) inFlight.current = null;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    isSignedIn,
    linkedReady,
    visitorId,
    tier,
    tierDef,
    result,
    errCode,
    retryNonce,
    redeem,
    queryClient,
  ]);

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen grid place-items-center bg-[hsl(var(--brand-cream))] texture-paper p-6 text-center">
      <div className="card-pop bg-white p-8 max-w-md w-full">{children}</div>
    </div>
  );

  if (!tierDef) {
    return shell(
      <>
        <h1 className="text-2xl font-black mb-2" style={{ fontFamily: "Bungee, sans-serif" }}>
          Unknown prize
        </h1>
        <p className="text-sm text-foreground/70 mb-4">
          This redemption code isn't valid.
        </p>
        <Link href="/passport/stamps" className="button-pop button-pop-yellow inline-block">
          Back to my passport
        </Link>
      </>,
    );
  }

  if (!authLoaded) {
    return shell(<div className="text-sm font-bold opacity-60">Loading…</div>);
  }

  if (!isSignedIn) {
    return shell(
      <>
        <div className="flex justify-center mb-3">
          <Gift className="w-10 h-10 text-[hsl(var(--brand-red))]" />
        </div>
        <h1 className="text-2xl font-black mb-2" style={{ fontFamily: "Bungee, sans-serif" }}>
          Log in to redeem
        </h1>
        <p className="text-sm text-foreground/70 mb-5">
          Sign in to your passport to redeem the {tier}-stamp prize.
        </p>
        <Link href="/sign-in" className="button-pop button-pop-yellow block w-full text-center">
          Log in
        </Link>
      </>,
    );
  }

  if (result) {
    return shell(
      <>
        <div
          className="inline-flex items-center gap-1 px-3 py-1 border-2 border-foreground text-xs font-black tracking-widest mb-3 bg-[hsl(var(--brand-lime))]"
          style={{ fontFamily: "Bungee, sans-serif" }}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          PRIZE REDEEMED!
        </div>
        <h1 className="text-2xl font-black mb-2" style={{ fontFamily: "Bungee, sans-serif" }}>
          {tier}-Stamp Prize
        </h1>
        <ul className="text-sm font-semibold text-foreground/80 mb-4 space-y-1">
          {tierDef.options.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <p className="text-xs font-bold text-foreground/60 mb-5">
          {result.effectiveBalance} stamp{result.effectiveBalance === 1 ? "" : "s"} remaining.
        </p>
        <Link
          href="/passport/stamps"
          className="button-pop button-pop-yellow inline-block"
        >
          Back to my passport
        </Link>
      </>,
    );
  }

  if (errCode) {
    const copy: Record<string, { title: string; body: string; retry: boolean }> = {
      too_far: {
        title: "Not at Peachtree Wellness",
        body: "Prizes can only be redeemed at the Peachtree Wellness front desk. Head there and tap retry.",
        retry: true,
      },
      location_required: {
        title: "Location needed",
        body: "We need your location to confirm you're at Peachtree Wellness. Turn on location and retry.",
        retry: true,
      },
      denied: {
        title: "Location is off",
        body: "Allow location access so we can confirm you're at Peachtree Wellness, then retry.",
        retry: true,
      },
      timeout: {
        title: "Couldn't get your location",
        body: "Getting your location took too long. Make sure location is on and retry.",
        retry: true,
      },
      unavailable: {
        title: "Location unavailable",
        body: "Your device couldn't share a location. Check your settings and retry.",
        retry: true,
      },
      insufficient: {
        title: "Not enough stamps yet",
        body: `You need ${tier} available stamps to redeem this prize. Keep stamping!`,
        retry: false,
      },
      already: {
        title: "Already redeemed",
        body: "This prize tier has already been redeemed on your passport.",
        retry: false,
      },
      failed: {
        title: "Couldn't redeem",
        body: "Something went wrong. Please try again.",
        retry: true,
      },
    };
    const c = copy[errCode] ?? copy.failed;
    return shell(
      <>
        <div className="flex justify-center mb-3">
          <Navigation className="w-10 h-10 text-[hsl(var(--brand-red))]" />
        </div>
        <h1 className="text-xl font-black mb-2" style={{ fontFamily: "Bungee, sans-serif" }}>
          {c.title}
        </h1>
        <p className="text-sm text-foreground/70 mb-5">{c.body}</p>
        {c.retry ? (
          <button
            type="button"
            onClick={() => {
              setErrCode(null);
              setRetryNonce((n) => n + 1);
            }}
            className="button-pop button-pop-yellow w-full"
          >
            Retry
          </button>
        ) : (
          <Link
            href="/passport/stamps"
            className="button-pop button-pop-yellow inline-block"
          >
            Back to my passport
          </Link>
        )}
      </>,
    );
  }

  return shell(
    <div className="text-sm font-bold opacity-60">
      {isPending ? "Redeeming…" : "Checking your location…"}
    </div>,
  );
}
