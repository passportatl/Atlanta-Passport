import { useState } from "react";
import { useListBusinesses, type Business } from "@workspace/api-client-react";
import { Copy, ExternalLink, QrCode } from "lucide-react";

function buildStampUrl(slug: string): string {
  if (typeof window === "undefined") return `/stamp/${slug}`;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${window.location.origin}${base}/stamp/${slug}`;
}

export default function AdminStamps() {
  const { data: businessesRaw } = useListBusinesses();
  const businesses = (businessesRaw as Business[] | undefined) ?? [];
  const [copied, setCopied] = useState<string | null>(null);

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
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
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
            Print or share these links so visitors can collect stamps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {businesses.map((b) => {
            const url = buildStampUrl(b.slug);
            const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
              url,
            )}&size=240x240&margin=10`;
            return (
              <div key={b.id} className="card-pop bg-white p-5">
                <div className="flex gap-4">
                  <img
                    src={qrSrc}
                    alt={`QR for ${b.name}`}
                    width={120}
                    height={120}
                    className="border-2 border-foreground rounded-lg bg-white shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-lg leading-tight" style={{ fontFamily: "Bungee, sans-serif" }}>
                      {b.name}
                    </div>
                    <div className="text-xs uppercase tracking-wider font-bold opacity-70 mt-0.5">
                      {b.neighborhood} • {b.category}
                    </div>
                    <div className="mt-2 text-xs break-all bg-[hsl(var(--brand-cream))] border-2 border-foreground rounded p-2 font-mono">
                      {url}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    onClick={() => copy(b.slug, url)}
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
          })}
        </div>

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
