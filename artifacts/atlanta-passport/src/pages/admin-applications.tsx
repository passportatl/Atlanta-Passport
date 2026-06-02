import { useEffect, useMemo, useState } from "react";
import {
  useListApplications,
  getListApplicationsQueryKey,
  type Application,
} from "@workspace/api-client-react";
import { Lock, Mail, Phone, Globe, Instagram, MapPin, Inbox } from "lucide-react";
import AdminNav from "@/components/AdminNav";

const ADMIN_PASSWORD =
  (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) ?? "atlanta2026";
const UNLOCK_KEY = "atlanta-passport-admin-unlocked";

const PACKAGE_COLORS: Record<string, string> = {
  starter: "bg-brand-yellow text-brand-yellow-foreground",
  featured: "bg-brand-red text-white",
  premier: "bg-brand-navy text-white",
  route: "bg-brand-cream text-foreground",
  custom: "bg-brand-lime text-foreground",
};

const DELIVERY_BADGE: Record<string, { label: string; cls: string }> = {
  sent: { label: "Emailed", cls: "bg-brand-lime text-foreground" },
  skipped: { label: "Saved only", cls: "bg-brand-cream text-foreground" },
  failed: { label: "Email failed", cls: "bg-brand-red text-white" },
  pending: { label: "Pending", cls: "bg-brand-cream text-foreground" },
};

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
          Enter the admin password to view partner applications.
        </p>
        <label className="block text-xs font-black uppercase tracking-wider mb-1">
          Password
        </label>
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
          <p className="text-xs text-[hsl(var(--brand-red))] font-bold mt-2">
            Incorrect password.
          </p>
        )}
        <button type="submit" className="button-pop button-pop-yellow w-full mt-4">
          Unlock
        </button>
      </form>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ApplicationCard({ app }: { app: Application }) {
  const pkgCls = PACKAGE_COLORS[app.package] ?? "bg-brand-cream text-foreground";
  const badge = DELIVERY_BADGE[app.emailDelivered] ?? DELIVERY_BADGE.pending!;
  return (
    <div className="card-pop bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-1">
            {formatDate(app.createdAt)}
          </div>
          <h3
            className="text-xl font-black leading-tight"
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            {app.businessName}
          </h3>
          <div className="text-xs uppercase tracking-wider font-bold opacity-70 mt-0.5">
            {app.category.join(", ")} · {app.neighborhood}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-start">
          <span
            className={`badge-sticker ${pkgCls} text-[10px]`}
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            {app.package.toUpperCase()}
            {app.routeId ? ` · ${app.routeId}` : ""}
          </span>
          <span className={`badge-sticker ${badge.cls} text-[10px]`}>{badge.label}</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-3">
        <div className="font-bold">{app.contactName}</div>
        <a
          href={`mailto:${app.email}`}
          className="flex items-center gap-1.5 hover:underline truncate"
        >
          <Mail className="w-3.5 h-3.5 shrink-0" />
          {app.email}
        </a>
        <a
          href={`tel:${app.phone}`}
          className="flex items-center gap-1.5 hover:underline"
        >
          <Phone className="w-3.5 h-3.5 shrink-0" />
          {app.phone}
        </a>
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{app.address}</span>
        </div>
        {app.website && (
          <a
            href={app.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:underline truncate"
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{app.website}</span>
          </a>
        )}
        {app.instagram && (
          <div className="flex items-center gap-1.5 truncate">
            <Instagram className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{app.instagram}</span>
          </div>
        )}
      </div>

      <div className="bg-[hsl(var(--brand-cream))] border-2 border-foreground rounded-lg p-3 text-sm">
        <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">
          Offer
        </div>
        <p className="whitespace-pre-wrap leading-snug">{app.offer}</p>
      </div>

      {app.notes && (
        <div className="mt-2 bg-white border-2 border-foreground rounded-lg p-3 text-sm">
          <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">
            Notes
          </div>
          <p className="whitespace-pre-wrap leading-snug">{app.notes}</p>
        </div>
      )}
    </div>
  );
}

export default function AdminApplications() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(UNLOCK_KEY) === "1") setUnlocked(true);
  }, []);

  const { data: appsRaw, isLoading } = useListApplications({
    query: {
      enabled: unlocked,
      queryKey: getListApplicationsQueryKey(),
      refetchInterval: 30000,
    },
  });
  const applications = (appsRaw as Application[] | undefined) ?? [];

  const counts = useMemo(() => {
    return {
      total: applications.length,
      starter: applications.filter((a) => a.package === "starter").length,
      featured: applications.filter((a) => a.package === "featured").length,
      premier: applications.filter((a) => a.package === "premier").length,
      route: applications.filter((a) => a.package === "route").length,
      custom: applications.filter((a) => a.package === "custom").length,
    };
  }, [applications]);

  if (!unlocked) return <AdminGate onUnlock={() => setUnlocked(true)} />;

  return (
    <div className="min-h-screen bg-[hsl(var(--brand-cream))] texture-paper py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <AdminNav onLock={() => setUnlocked(false)} />
        <div className="mb-6">
          <h1
            className="text-3xl font-black"
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            Partner Applications
          </h1>
          <p className="text-sm text-foreground/70 mt-1">
            {counts.total} total · Starter {counts.starter} · Featured {counts.featured} ·
            Premier {counts.premier} · Route {counts.route} · Custom {counts.custom}
          </p>
          <p className="text-xs text-foreground/60 mt-1">
            Notifications send to <strong>touristpassportatl@gmail.com</strong>.
          </p>
        </div>

        {isLoading && (
          <div className="card-pop bg-white p-8 text-center text-sm">Loading…</div>
        )}

        {!isLoading && applications.length === 0 && (
          <div className="card-pop bg-white p-10 text-center">
            <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p
              className="font-black text-lg"
              style={{ fontFamily: "Bungee, sans-serif" }}
            >
              No applications yet
            </p>
            <p className="text-sm text-foreground/70 mt-1">
              They'll show up here the moment someone submits the apply form.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {applications.map((a) => (
            <ApplicationCard key={a.id} app={a} />
          ))}
        </div>
      </div>
    </div>
  );
}
