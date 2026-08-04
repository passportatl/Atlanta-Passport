import { Link } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import {
  useListVisitorStamps,
  useListBusinesses,
  useListVisitorRedemptions,
  getListVisitorStampsQueryKey,
  getListVisitorRedemptionsQueryKey,
  type Stamp,
  type Business,
  type Redemption,
} from "@workspace/api-client-react";
import { useVisitor } from "@/passport/visitor-context";
import { basePath } from "@/auth/clerk";
import { StartPassportForm } from "@/passport/StartPassportForm";
import { StampGraphic } from "@/passport/StampGraphic";
import { PrizeLadder } from "@/passport/PrizeLadder";
import Sticker from "@/components/Sticker";
import { NEIGHBORHOOD_BY_NAME } from "@/passport/data";
import { STAMP_IMAGE_BY_SLUG } from "@/data/sample-data";
import { CommunicationPreferences } from "@/passport/CommunicationPreferences";

export default function PassportHome() {
  const { visitorId, visitor } = useVisitor();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const { data: stampsRaw } = useListVisitorStamps(visitorId ?? "", {
    query: {
      queryKey: getListVisitorStampsQueryKey(visitorId ?? ""),
      enabled: !!visitorId,
    },
  });
  const stamps = (stampsRaw as Stamp[] | undefined) ?? [];

  const { data: businessesRaw } = useListBusinesses();
  const businesses = (businessesRaw as Business[] | undefined) ?? [];

  const { data: redemptionsRaw } = useListVisitorRedemptions(visitorId ?? "", {
    query: {
      queryKey: getListVisitorRedemptionsQueryKey(visitorId ?? ""),
      enabled: !!visitorId,
    },
  });
  const redeemedTiers = (
    (redemptionsRaw as Redemption[] | undefined) ?? []
  ).map((r) => ({ tierStamps: r.tierStamps, redeemedAt: r.redeemedAt }));

  if (!visitorId) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div
            className="inline-block bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-yellow-foreground))] border-2 border-foreground px-3 py-1 text-xs font-black tracking-widest mb-3"
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            DIGITAL PASSPORT
          </div>
          <h1
            className="text-3xl sm:text-4xl font-black mb-1"
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            Passport Rewards
          </h1>
          <p className="text-sm text-foreground/70">
            Collect stamps at participating spots. Unlock secret routes &
            rewards.
          </p>
        </div>
        <StartPassportForm />
      </div>
    );
  }

  const total = stamps.length;
  const neighborhoods = new Set(stamps.map((s) => s.neighborhood));

  // Passport history — keeps a record of past + current passports and what each
  // was redeemed for. Add new seasons here as they launch (mark the live one
  // "Current" and set the prior one's `redeemedFor`).
  const passports: {
    name: string;
    status: string;
    redeemedFor: string | null;
  }[] = [
    { name: "Summer 2026 Passport", status: "Current", redeemedFor: null },
  ];

  const visited = stamps.slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <Sticker color="lime" className="mb-3">
          YOUR PASSPORT
        </Sticker>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1
            className="text-3xl sm:text-4xl font-black"
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            Hey, {visitor?.firstName ?? "Explorer"}.
          </h1>
          {visitor?.createdAt && (
            <span className="text-sm font-bold text-[hsl(var(--brand-gold))]">
              Member since{" "}
              {new Date(
                visitor.createdAt as unknown as string,
              ).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
          {isSignedIn && (
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              {user?.primaryEmailAddress?.emailAddress && (
                <span className="text-sm font-medium text-foreground/70 break-all">
                  {user.primaryEmailAddress.emailAddress}
                </span>
              )}
              <button
                type="button"
                onClick={() => signOut({ redirectUrl: `${basePath}/` })}
                className="text-sm font-bold text-[hsl(var(--brand-red))] underline underline-offset-2 hover:text-[hsl(var(--brand-red))]/80"
              >
                Not you? Sign out
              </button>
            </span>
          )}
        </div>
        <p className="text-sm text-foreground/70 mt-1">
          {total === 0
            ? "Your passport is ready. Scan a QR at any participating spot to start."
            : `You've collected ${total} stamp${total === 1 ? "" : "s"} across ${neighborhoods.size} neighborhood${neighborhoods.size === 1 ? "" : "s"}.`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card-pop bg-white p-4">
          <div className="text-xs font-black uppercase tracking-wider opacity-60">
            Stamps
          </div>
          <div
            className="text-3xl font-black"
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            {total}
          </div>
        </div>
        <div className="card-pop bg-white p-4">
          <div className="text-xs font-black uppercase tracking-wider opacity-60">
            Passports
          </div>
          <ul className="mt-2 space-y-2">
            {passports.map((p) => (
              <li key={p.name}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-sm leading-tight">
                    {p.name}
                  </span>
                  <span
                    className={`shrink-0 rounded-full border-2 border-foreground px-2 py-0.5 font-display text-[9px] tracking-[0.1em] uppercase shadow-pop-sm ${
                      p.status === "Current"
                        ? "bg-brand-lime text-foreground"
                        : "bg-white text-foreground/70"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                {p.redeemedFor && (
                  <div className="text-xs font-bold text-foreground/60 mt-0.5">
                    Redeemed for {p.redeemedFor}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <PrizeLadder
        collected={total}
        redeemedTiers={redeemedTiers}
        title="Summer 2026 Passport Prize Ladder"
      />

      <section className="card-pop bg-white p-5">
        <h2 className="mb-2 text-xl font-black">Communication Preferences</h2>
        <p className="mb-4 text-sm leading-relaxed text-foreground/70">
          Choose whether you receive Passport ATL newsletters, rewards, and
          promotional updates.
        </p>
        <CommunicationPreferences />
      </section>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-xl font-black"
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            Recent Stamps
          </h2>
          <Link
            href="/passport/stamps"
            className="text-xs font-black underline"
          >
            See all
          </Link>
        </div>
        {visited.length === 0 ? (
          <div className="card-pop bg-white p-5 text-sm text-foreground/70">
            No stamps yet. Scan a QR at any participating spot to start.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {visited.map((s, i) => {
              const biz = businesses.find((b) => b.slug === s.businessSlug);
              const def = NEIGHBORHOOD_BY_NAME[s.neighborhood];
              return (
                <div key={s.id} className="flex justify-center">
                  <StampGraphic
                    neighborhood={def?.short ?? s.neighborhood}
                    iconName={biz?.icon ?? def?.stampIcon ?? "coffee"}
                    iconUrl={STAMP_IMAGE_BY_SLUG[s.businessSlug]}
                    color={biz?.stampColor ?? def?.stampColor ?? "yellow"}
                    collectedAt={s.collectedAt as unknown as string}
                    size={100}
                    rotate={i % 2 === 0 ? -4 : 3}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
