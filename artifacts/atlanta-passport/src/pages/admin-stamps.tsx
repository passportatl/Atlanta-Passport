import { useEffect, useMemo, useState } from "react";
import {
  useListBusinesses,
  getListBusinessesQueryKey,
  type Business,
} from "@workspace/api-client-react";
import { Copy, ExternalLink, Lock, QrCode } from "lucide-react";
import { NEIGHBORHOODS } from "@/passport/data";

const ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) ?? "atlanta2026";
const UNLOCK_KEY = "atlanta-passport-admin-unlocked";

function buildStampUrl(slug: string): string {
  if (typeof window === "undefined") return `/stamp/${slug}`;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${window.location.origin}${base}/stamp/${slug}`;
}

const NEIGHBORHOOD_ORDER = NEIGHBORHOODS.map((n) => n.name);

function AdminGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(UNLOCK_KEY, "1");
      onUnlock();
    } else {
      setErr(true);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--brand-cream))] texture-paper grid place-items-center px-4">
      <form onSubmit={submit} className="card-pop bg-white p-6 max-w-sm w-full">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-5 h-5" />
          <h1 className="text-xl font-black" style={{ fontFamily: "Bungee, sans-serif" }}>
            Admin access
          </h1>
        </div>
        <p className="text-sm text-foreground/70 mb-4">
          Enter the admin password to view stamp QR codes.
        </p>
        <label className="block text-xs font-black uppercase tracking-wider mb-1">Password</label>
        <input
          type="password"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setErr(false);
          }}
          autoFocus
          className="w-full border-2 border-foreground rounded-md px-3 py-2 font-mono text-sm bg-[hsl(var(--brand-cream))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-yellow))]"
          placeholder="••••••••"
        />
        {err && (
          <p className="text-xs text-[hsl(var(--brand-red))] font-bold mt-2">Incorrect password.</p>
        )}
        <button type="submit" className="button-pop button-pop-yellow w-full mt-4">
          Unlock
        </button>
      </form>
    </div>
  );
}

interface BusinessCardProps {
  business: Business;
  copied: string | null;
  onCopy: (slug: string, url: string) => void;
}

function BusinessCard({ business: b, copied, onCopy }: BusinessCardProps) {
  const url = buildStampUrl(b.slug);
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

export default function AdminStamps() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(UNLOCK_KEY) === "1") setUnlocked(true);
  }, []);

  const { data: businessesRaw } = useListBusinesses({
    query: { enabled: unlocked, queryKey: getListBusinessesQueryKey() },
  });
  const businesses = (businessesRaw as Business[] | undefined) ?? [];
  const [copied, setCopied] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const buckets: Record<string, Business[]> = {};
    businesses.forEach((b) => {
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
  }, [businesses]);

  const copy = async (slug: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(slug);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  };

  if (!unlocked) return <AdminGate onUnlock={() => setUnlocked(true)} />;

  return (
    <div className="min-h-screen bg-[hsl(var(--brand-cream))] texture-paper py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div
              className="inline-block bg-[hsl(var(--brand-navy))] text-[hsl(var(--brand-cream))] border-2 border-foreground px-3 py-1 text-xs font-black tracking-widest mb-2"
              style={{ fontFamily: "Bungee, sans-serif" }}
            >
              ADMIN
            </div>
            <h1 className="text-3xl font-black" style={{ fontFamily: "Bungee, sans-serif" }}>
              Demo QR Codes
            </h1>
            <p className="text-sm text-foreground/70 mt-1">
              {businesses.length} businesses across {grouped.length} neighborhoods. Print or share these links so visitors can collect stamps.
            </p>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem(UNLOCK_KEY);
              setUnlocked(false);
            }}
            className="text-xs underline opacity-70 hover:opacity-100 shrink-0"
          >
            Lock
          </button>
        </div>

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
                <BusinessCard key={b.id} business={b} copied={copied} onCopy={copy} />
              ))}
            </div>
          </section>
        ))}

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
