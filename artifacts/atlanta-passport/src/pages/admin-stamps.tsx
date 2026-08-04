import { useEffect, useMemo, useState } from "react";
import {
  useListBusinesses,
  useExportQrCodes,
  getListBusinessesQueryKey,
  ApiError,
  type Business,
  type ExportQrResult,
} from "@workspace/api-client-react";
import {
  AlertTriangle,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  Lock,
  QrCode,
  Star,
} from "lucide-react";
import { NEIGHBORHOODS, STAMP_SLUG } from "@/passport/data";
import AdminNav from "@/components/AdminNav";
import { restoreAdminKey } from "@/lib/adminSession";

// Slugs of the current passport stops — the only sponsor-location QRs shown.
const PASSPORT_STOP_SLUGS = new Set(Object.values(STAMP_SLUG));

// Prize-tier stamp costs — mirror of PRIZE_TIERS on the client and
// PRIZE_TIER_STAMPS in the API's redemptions route.
const PRIZE_TIER_STAMPS = [3, 7, 10, 13, 15];

const API_BASE = "/api";
const UNLOCK_KEY = "atlanta-passport-admin-unlocked";
const ADMIN_KEY_STORAGE = "atlanta-passport-admin-key";
const PUBLISHED_URL_KEY = "atlanta-passport-published-url";

// Turn whatever the admin pasted into a clean origin (scheme + host), or null if
// it isn't a usable URL. Lets us build production QR links from any workspace.
function normalizeOrigin(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProto).origin;
  } catch {
    return null;
  }
}

function buildStampUrl(slug: string, publishedOrigin?: string | null): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  // A pasted published origin always wins, so QR codes are public-scannable even
  // when generated from the private dev/preview workspace.
  if (publishedOrigin) return `${publishedOrigin}${base}/stamp/${slug}`;
  if (typeof window === "undefined") return `${base}/stamp/${slug}`;
  return `${window.location.origin}${base}/stamp/${slug}`;
}

function buildRedeemUrl(tier: number, publishedOrigin?: string | null): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  if (publishedOrigin) return `${publishedOrigin}${base}/redeem/${tier}`;
  if (typeof window === "undefined") return `${base}/redeem/${tier}`;
  return `${window.location.origin}${base}/redeem/${tier}`;
}

// The QR codes encode the domain you're currently viewing this page on. Replit
// development/preview domains are private — opening one on a phone prompts to log
// into / install the Replit app. Only the published site is publicly scannable,
// so warn if QR codes are being generated from a non-public host.
function isPublicHostname(h: string): boolean {
  // Published sites (*.replit.app or a custom domain) are publicly scannable.
  if (h.endsWith(".replit.app")) return true;
  // Local + Replit development/preview domains are private.
  if (h === "localhost" || h === "127.0.0.1") return false;
  if (h.endsWith(".replit.dev") || h.endsWith(".repl.co")) return false;
  return true;
}

import AdminGate from "@/components/AdminGate";

function isPublicHost(): boolean {
  if (typeof window === "undefined") return true;
  return isPublicHostname(window.location.hostname);
}

const NEIGHBORHOOD_ORDER = NEIGHBORHOODS.map((n) => n.name);

interface LocationCardProps {
  business: Business;
  copied: string | null;
  onCopy: (slug: string, url: string) => void;
  publishedOrigin: string | null;
}

function LocationCard({ business: b, copied, onCopy, publishedOrigin }: LocationCardProps) {
  const url = buildStampUrl(b.slug, publishedOrigin);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    url,
  )}&size=240x240&margin=10`;
  return (
    <div className="card-pop bg-white p-4">
      <div className="flex gap-3">
        <img
          src={qrSrc}
          alt={`QR for ${b.name}`}
          width={96}
          height={96}
          className="border-2 border-foreground rounded-lg bg-white shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="font-black text-sm leading-tight" style={{ fontFamily: "Bungee, sans-serif" }}>
            {b.name}
          </div>
          <div className="text-[10px] uppercase tracking-wider font-bold opacity-70 mt-0.5">
            {b.category}
          </div>
          <div className="mt-1.5 text-[10px] break-all bg-[hsl(var(--brand-cream))] border-2 border-foreground rounded p-1.5 font-mono">
            {url}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          onClick={() => onCopy(b.slug, url)}
          className="button-pop button-pop-cream text-xs flex items-center justify-center gap-1"
        >
          <Copy className="w-3.5 h-3.5" />
          {copied === b.slug ? "Copied!" : "Copy link"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="button-pop button-pop-yellow text-xs flex items-center justify-center gap-1"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open stamp
        </a>
      </div>
    </div>
  );
}

// Generates an Excel workbook of QR codes (11 sponsor offers + 6 bonus events +
// 5 prize-tier redemption codes) on Google Drive, named "Summer 2026 passport qr
// codes". Re-running overwrites the same file. QR images encode the live public
// origin the admin pasted above, so they scan with no Replit login.
function ExportCard({ publishedOrigin }: { publishedOrigin: string | null }) {
  const { mutateAsync: exportQr, isPending } = useExportQrCodes();
  const [result, setResult] = useState<ExportQrResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!publishedOrigin) return;
    setError(null);
    setResult(null);
    try {
      const r = (await exportQr({
        data: { publishedOrigin },
      })) as ExportQrResult;
      setResult(r);
    } catch (e) {
      const msg =
        e instanceof ApiError &&
        e.data &&
        typeof e.data === "object" &&
        "error" in e.data
          ? String((e.data as { error?: unknown }).error)
          : "Export failed. Please try again.";
      setError(msg);
    }
  };

  return (
    <div className="mb-6 card-pop bg-white p-4">
      <label className="block text-xs font-black uppercase tracking-wider mb-1">
        Export QR codes to Google Drive
      </label>
      <p className="text-xs text-foreground/60 mb-3">
        Generates an Excel sheet named{" "}
        <span className="font-mono">Summer 2026 passport qr codes</span> with every
        scannable QR (sponsor offers, bonus events, and the 5 prize-tier redemption
        codes). Re-running overwrites the same file.
        {!publishedOrigin && (
          <span className="block mt-1 font-bold text-[hsl(var(--brand-red))]">
            Paste your published site URL above first so the QR codes are publicly
            scannable.
          </span>
        )}
      </p>
      <button
        type="button"
        onClick={run}
        disabled={isPending}
        className="button-pop button-pop-yellow inline-flex items-center gap-2 disabled:opacity-60"
      >
        <FileSpreadsheet className="w-4 h-4" />
        {isPending ? "Generating…" : "Export to Google Drive"}
      </button>
      {result && (
        <p className="mt-3 inline-flex items-center gap-1 border-2 border-foreground bg-[hsl(var(--brand-lime))] rounded px-2 py-1 text-xs font-black">
          ✓ Saved <span className="font-mono">{result.fileName}</span> —{" "}
          <a href={result.url} target="_blank" rel="noreferrer" className="underline">
            open in Drive
          </a>
        </p>
      )}
      {error && (
        <p className="text-xs font-bold text-[hsl(var(--brand-red))] mt-3">{error}</p>
      )}
    </div>
  );
}

export default function AdminStamps() {
  return (
    <AdminGate>
      {() => <AdminStampsInner />}
    </AdminGate>
  );
}

function AdminStampsInner() {
  const { data: businessesRaw } = useListBusinesses({
    query: { queryKey: getListBusinessesQueryKey() },
  });
  const businesses = (businessesRaw as Business[] | undefined) ?? [];
  const [copied, setCopied] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(PUBLISHED_URL_KEY);
    if (saved) setPublishedUrl(saved);
  }, []);

  const normalizedOrigin = normalizeOrigin(publishedUrl);
  // Only a PUBLIC origin is usable for QR codes — a private dev address would
  // re-introduce the very "log in / install Replit" prompt we're avoiding.
  const publishedOrigin =
    normalizedOrigin && isPublicHostname(new URL(normalizedOrigin).hostname)
      ? normalizedOrigin
      : null;
  const enteredPrivate = Boolean(normalizedOrigin) && !publishedOrigin;

  const savePublishedUrl = (value: string) => {
    setPublishedUrl(value);
    const origin = normalizeOrigin(value);
    if (origin && isPublicHostname(new URL(origin).hostname)) {
      window.localStorage.setItem(PUBLISHED_URL_KEY, origin);
    } else {
      window.localStorage.removeItem(PUBLISHED_URL_KEY);
    }
  };

  const locationBusinesses = useMemo(
    () =>
      businesses.filter(
        (b) => b.category !== "events" && PASSPORT_STOP_SLUGS.has(b.slug),
      ),
    [businesses],
  );
  const eventBusinesses = useMemo(
    () =>
      businesses
        .filter((b) => b.category === "events" && b.isActive !== false)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [businesses],
  );

  const grouped = useMemo(() => {
    const buckets: Record<string, Business[]> = {};
    locationBusinesses.forEach((b) => {
      (buckets[b.neighborhood] ??= []).push(b);
    });
    Object.values(buckets).forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
    const ordered = NEIGHBORHOOD_ORDER.filter((n) => buckets[n]?.length).map((n) => ({
      neighborhood: n,
      list: buckets[n]!,
    }));
    const extras = Object.keys(buckets)
      .filter((n) => !NEIGHBORHOOD_ORDER.includes(n))
      .sort()
      .map((n) => ({ neighborhood: n, list: buckets[n]! }));
    return [...ordered, ...extras];
  }, [locationBusinesses]);

  const copy = async (slug: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(slug);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--brand-cream))] texture-paper py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <AdminNav />
        <div className="mb-6">
          <h1 className="text-3xl font-black" style={{ fontFamily: "Bungee, sans-serif" }}>
            QR Codes
          </h1>
          <p className="text-sm text-foreground/70 mt-1">
            {locationBusinesses.length} passport stops, {eventBusinesses.length} bonus stamps, and {PRIZE_TIER_STAMPS.length} prize redemption codes. Print or share these links so visitors can collect stamps and redeem prizes.
          </p>
        </div>

        <div className="mb-6 card-pop bg-white p-4">
          <label className="block text-xs font-black uppercase tracking-wider mb-1">
            Published site URL
          </label>
          <p className="text-xs text-foreground/60 mb-2">
            Paste your live <span className="font-mono">.replit.app</span> (or custom domain) address. Every QR code and link below will point there, so visitors can scan them with no Replit login or app — even while you generate them from here.
          </p>
          <input
            type="url"
            inputMode="url"
            value={publishedUrl}
            onChange={(e) => savePublishedUrl(e.target.value)}
            placeholder="https://your-site.replit.app"
            className="w-full border-2 border-foreground rounded-md px-3 py-2 font-mono text-sm bg-[hsl(var(--brand-cream))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-yellow))]"
          />
          {publishedOrigin ? (
            <p className="mt-2 inline-flex items-center gap-1 border-2 border-foreground bg-[hsl(var(--brand-lime))] rounded px-2 py-1 text-xs font-black">
              ✓ QR codes point to <span className="font-mono">{publishedOrigin}</span>
            </p>
          ) : enteredPrivate ? (
            <p className="text-xs font-bold text-[hsl(var(--brand-red))] mt-2">
              That's a private dev address — paste your public{" "}
              <span className="font-mono">.replit.app</span> (or custom) domain.
            </p>
          ) : publishedUrl.trim() ? (
            <p className="text-xs font-bold text-[hsl(var(--brand-red))] mt-2">
              That doesn't look like a valid web address.
            </p>
          ) : null}
        </div>

        <ExportCard publishedOrigin={publishedOrigin} />

        {!isPublicHost() && !publishedOrigin && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border-2 border-foreground bg-[hsl(var(--brand-yellow))] p-4 shadow-pop-sm">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
            <div className="text-sm font-semibold leading-snug">
              <p className="font-black uppercase tracking-wide">Don't print these QR codes yet</p>
              <p className="mt-1 font-medium">
                You're viewing the private development preview, so these QR codes point to a Replit URL that asks visitors to log in or install the Replit app. Paste your <span className="font-black">published site URL</span> in the box above (or open the published <span className="font-mono">.replit.app</span> site and generate them there) — then they'll scan publicly with no app or login.
              </p>
            </div>
          </div>
        )}

        {grouped.map(({ neighborhood, list }) => (
          <section key={neighborhood} className="mb-8">
            <div className="flex items-baseline justify-between mb-3">
              <h2
                className="text-xl font-black"
                style={{ fontFamily: "Bungee, sans-serif" }}
              >
                {neighborhood}
              </h2>
              <div className="text-[11px] font-black uppercase tracking-wider opacity-60">
                {list.length} spot{list.length === 1 ? "" : "s"}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((b) => (
                <LocationCard key={b.id} business={b} copied={copied} onCopy={copy} publishedOrigin={publishedOrigin} />
              ))}
            </div>
          </section>
        ))}

        {eventBusinesses.length > 0 && (
          <section className="mb-8">
            <div className="border-t-2 border-foreground/15 pt-6">
              <div className="flex items-baseline justify-between mb-1">
                <h2
                  className="text-xl font-black inline-flex items-center gap-2"
                  style={{ fontFamily: "Bungee, sans-serif" }}
                >
                  <Star className="w-5 h-5 fill-[hsl(var(--brand-yellow))]" />
                  Featured Events — Bonus Stamps
                </h2>
                <div className="text-[11px] font-black uppercase tracking-wider opacity-60">
                  {eventBusinesses.length} event{eventBusinesses.length === 1 ? "" : "s"}
                </div>
              </div>
              <p className="text-sm text-foreground/70 mb-3">
                Scanned at the event, these add a bonus stamp to the visitor's passport and count toward their rewards total.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {eventBusinesses.map((b) => (
                  <LocationCard key={b.id} business={b} copied={copied} onCopy={copy} publishedOrigin={publishedOrigin} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="mb-8">
          <div className="border-t-2 border-foreground/15 pt-6">
            <div className="flex items-baseline justify-between mb-1">
              <h2
                className="text-xl font-black"
                style={{ fontFamily: "Bungee, sans-serif" }}
              >
                Prize Redemption
              </h2>
              <div className="text-[11px] font-black uppercase tracking-wider opacity-60">
                {PRIZE_TIER_STAMPS.length} tiers
              </div>
            </div>
            <p className="text-sm text-foreground/70 mb-3">
              Scanned at the prize desk — each code redeems the reward for that stamp tier.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PRIZE_TIER_STAMPS.map((tier) => {
                const url = buildRedeemUrl(tier, publishedOrigin);
                const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=240x240&margin=10`;
                const key = `redeem-${tier}`;
                return (
                  <div key={key} className="card-pop bg-white p-4">
                    <div className="flex gap-3">
                      <img
                        src={qrSrc}
                        alt={`QR for prize tier ${tier} stamps`}
                        width={96}
                        height={96}
                        className="border-2 border-foreground rounded-lg bg-white shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-sm leading-tight" style={{ fontFamily: "Bungee, sans-serif" }}>
                          Prize Tier — {tier} stamps
                        </div>
                        <div className="text-[10px] uppercase tracking-wider font-bold opacity-70 mt-0.5">
                          Redemption
                        </div>
                        <div className="mt-1.5 text-[10px] break-all bg-[hsl(var(--brand-cream))] border-2 border-foreground rounded p-1.5 font-mono">
                          {url}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button
                        onClick={() => copy(key, url)}
                        className="button-pop button-pop-cream text-xs flex items-center justify-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copied === key ? "Copied!" : "Copy link"}
                      </button>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="button-pop button-pop-yellow text-xs flex items-center justify-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open page
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {businesses.length === 0 && (
          <div className="card-pop bg-white p-8 text-center">
            <QrCode className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-bold">No businesses loaded.</p>
          </div>
        )}
      </div>
    </div>
  );
}
