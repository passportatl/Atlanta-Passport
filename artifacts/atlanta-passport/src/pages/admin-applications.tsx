import { useEffect, useMemo, useState } from "react";
import {
  useListApplications,
  getListApplicationsQueryKey,
  useListAdminEvents,
  useGetAdminEventsSummary,
  useUpdateAdminEvent,
  getListAdminEventsQueryKey,
  getGetAdminEventsSummaryQueryKey,
  type Application,
  type AdminEventRecord,
  type AdminEventsSummary,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Lock,
  Mail,
  Phone,
  Globe,
  Instagram,
  MapPin,
  Inbox,
  Calendar,
  Clock,
  Ticket,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AdminNav from "@/components/AdminNav";

const ADMIN_PASSWORD =
  (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) ?? "atlanta2026";
const UNLOCK_KEY = "atlanta-passport-admin-unlocked";
const ADMIN_KEY_STORAGE = "atlanta-passport-admin-key";

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

const WORKFLOW_COLORS: Record<string, string> = {
  pending: "bg-brand-cream text-foreground",
  needs_verification: "bg-brand-yellow text-brand-yellow-foreground",
  possible_duplicate: "bg-brand-orange text-white",
  approved: "bg-brand-lime text-foreground",
  scheduled: "bg-brand-sky text-foreground",
  published: "bg-brand-navy text-white",
  rejected: "bg-brand-red text-white",
  canceled: "bg-foreground/20 text-foreground",
  archived: "bg-foreground/10 text-foreground/60",
};

function AdminGate({ onUnlock }: { onUnlock: (key: string) => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(UNLOCK_KEY, "1");
      sessionStorage.setItem(ADMIN_KEY_STORAGE, pw);
      onUnlock(pw);
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
          Enter the admin password to view submissions.
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

function EventCard({ app }: { app: Application }) {
  const badge = DELIVERY_BADGE[app.emailDelivered] ?? DELIVERY_BADGE.pending!;
  return (
    <div className="card-pop bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-1">
            Submitted {formatDate(app.createdAt)}
          </div>
          <h3
            className="text-xl font-black leading-tight"
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            {app.businessName}
          </h3>
          <div className="text-xs uppercase tracking-wider font-bold opacity-70 mt-0.5">
            {app.category.join(", ")}
            {app.neighborhood ? ` · ${app.neighborhood}` : ""}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-start">
          <span
            className="badge-sticker bg-brand-lime text-foreground text-[10px]"
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            EVENT
          </span>
          <span className={`badge-sticker ${badge.cls} text-[10px]`}>{badge.label}</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-3">
        {app.eventDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            {app.eventDate}
          </div>
        )}
        {app.eventTime && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {app.eventTime}
          </div>
        )}
        {app.eventVenue && (
          <div className="flex items-center gap-1.5 md:truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="md:truncate">{app.eventVenue}</span>
          </div>
        )}
        {app.eventCost && (
          <div className="flex items-center gap-1.5">
            <Ticket className="w-3.5 h-3.5 shrink-0" />
            {app.eventCost}
          </div>
        )}
        {app.eventUrl && (
          <a
            href={app.eventUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:underline md:truncate"
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="md:truncate">{app.eventUrl}</span>
          </a>
        )}
      </div>

      {app.promoContact && (
        <div className="text-sm mb-3 rounded-xl border-2 border-foreground bg-brand-cream px-3 py-2">
          <span className="font-bold">Wants promo contact</span>
          {" · Preferred: "}
          {app.promoContactMethod || "not specified"}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-3 border-t-2 border-dashed border-foreground/20 pt-3">
        <div className="font-bold">{app.contactName}</div>
        <a
          href={`mailto:${app.email}`}
          className="flex items-center gap-1.5 hover:underline md:truncate"
        >
          <Mail className="w-3.5 h-3.5 shrink-0" />
          {app.email}
        </a>
        <a href={`tel:${app.phone}`} className="flex items-center gap-1.5 hover:underline">
          <Phone className="w-3.5 h-3.5 shrink-0" />
          {app.phone}
        </a>
        {app.address && (
          <div className="flex items-center gap-1.5 md:truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="md:truncate">{app.address}</span>
          </div>
        )}
        {app.website && (
          <a
            href={app.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:underline md:truncate"
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="md:truncate">{app.website}</span>
          </a>
        )}
        {app.instagram && (
          <div className="flex items-center gap-1.5 md:truncate">
            <Instagram className="w-3.5 h-3.5 shrink-0" />
            <span className="md:truncate">{app.instagram}</span>
          </div>
        )}
      </div>

      <div className="bg-[hsl(var(--brand-cream))] border-2 border-foreground rounded-lg p-3 text-sm">
        <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">
          Description
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
          className="flex items-center gap-1.5 hover:underline md:truncate"
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
        <div className="flex items-center gap-1.5 md:truncate">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="md:truncate">{app.address}</span>
        </div>
        {app.website && (
          <a
            href={app.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:underline md:truncate"
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="md:truncate">{app.website}</span>
          </a>
        )}
        {app.instagram && (
          <div className="flex items-center gap-1.5 md:truncate">
            <Instagram className="w-3.5 h-3.5 shrink-0" />
            <span className="md:truncate">{app.instagram}</span>
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

// ── Events Ops ──────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "needs_verification", label: "Needs Review" },
  { id: "approved", label: "Approved" },
  { id: "published", label: "Published" },
  { id: "rejected", label: "Rejected" },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]["id"];

function SummaryBar({ summary }: { summary: AdminEventsSummary }) {
  const stats = [
    { label: "Total", value: summary.total, cls: "bg-foreground/10" },
    { label: "Pending", value: summary.pending, cls: "bg-brand-cream" },
    { label: "Needs Review", value: summary.needsVerification, cls: "bg-brand-yellow text-brand-yellow-foreground" },
    { label: "Approved", value: summary.approved, cls: "bg-brand-lime text-foreground" },
    { label: "Published", value: summary.published, cls: "bg-brand-navy text-white" },
    { label: "Rejected", value: summary.rejected, cls: "bg-brand-red text-white" },
  ];
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`rounded-xl border-2 border-foreground px-3 py-1.5 text-center shadow-pop-sm ${s.cls}`}
        >
          <div className="text-lg font-black leading-none">{s.value}</div>
          <div className="text-[9px] font-display uppercase tracking-widest opacity-70">{s.label}</div>
        </div>
      ))}
      <div className="rounded-xl border-2 border-foreground px-3 py-1.5 text-center shadow-pop-sm bg-foreground/5">
        <div className="text-lg font-black leading-none">{summary.avgCompleteness}%</div>
        <div className="text-[9px] font-display uppercase tracking-widest opacity-70">Avg Complete</div>
      </div>
    </div>
  );
}

type WorkflowAction = {
  label: string;
  status: string;
  icon: React.ReactNode;
  cls: string;
};

function getActions(current: string): WorkflowAction[] {
  const all: WorkflowAction[] = [
    { label: "Approve", status: "approved", icon: <CheckCircle className="w-3.5 h-3.5" />, cls: "bg-brand-lime text-foreground" },
    { label: "Publish", status: "published", icon: <Eye className="w-3.5 h-3.5" />, cls: "bg-brand-navy text-white" },
    { label: "Needs Review", status: "needs_verification", icon: <AlertTriangle className="w-3.5 h-3.5" />, cls: "bg-brand-yellow text-brand-yellow-foreground" },
    { label: "Reject", status: "rejected", icon: <XCircle className="w-3.5 h-3.5" />, cls: "bg-brand-red text-white" },
    { label: "Reset to Pending", status: "pending", icon: <RefreshCw className="w-3.5 h-3.5" />, cls: "bg-brand-cream text-foreground" },
  ];
  return all.filter((a) => a.status !== current);
}

function AdminEventCard({
  event,
  adminKey,
  onUpdated,
}: {
  event: AdminEventRecord;
  adminKey: string;
  onUpdated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notesValue, setNotesValue] = useState(event.adminNotes ?? "");
  const [saving, setSaving] = useState(false);

  const updateMutation = useUpdateAdminEvent({
    request: { headers: { "x-admin-key": adminKey } },
    mutation: { onSuccess: onUpdated },
  });

  const dispatch = (status: string) => {
    updateMutation.mutate({ id: event.id, data: { workflowStatus: status } });
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      updateMutation.mutate({
        id: event.id,
        data: { adminNotes: notesValue },
      });
    } finally {
      setSaving(false);
    }
  };

  const wfCls = WORKFLOW_COLORS[event.workflowStatus] ?? "bg-brand-cream text-foreground";
  const actions = getActions(event.workflowStatus);

  return (
    <div className="card-pop bg-white p-4">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-widest font-bold opacity-50 mb-0.5">
            {formatDate(event.createdAt)} · {event.source}
          </div>
          <h3 className="font-black text-base leading-tight" style={{ fontFamily: "Bungee, sans-serif" }}>
            {event.name}
          </h3>
          <div className="text-xs text-foreground/60 mt-0.5">
            {event.category}{event.neighborhood ? ` · ${event.neighborhood}` : ""}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 items-start shrink-0">
          <span className={`badge-sticker ${wfCls} text-[9px]`}>
            {event.workflowStatus.replace(/_/g, " ").toUpperCase()}
          </span>
          <span className="badge-sticker bg-foreground/10 text-[9px]">
            {event.completenessScore}%
          </span>
          {event.isBonusStamp && (
            <span className="badge-sticker bg-brand-orange text-white text-[9px]">BONUS STAMP</span>
          )}
        </div>
      </div>

      {/* Quick info */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/70 mb-2">
        {event.date && (
          <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{event.date}</span>
        )}
        {event.time && (
          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{event.time}</span>
        )}
        {event.venue && (
          <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue}</span>
        )}
        {event.cost && (
          <span className="inline-flex items-center gap-1"><Ticket className="w-3 h-3" />{event.cost}</span>
        )}
      </div>

      {/* Workflow action buttons */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {actions.map((a) => (
          <button
            key={a.status}
            type="button"
            disabled={updateMutation.isPending}
            onClick={() => dispatch(a.status)}
            className={`button-pop text-[10px] px-2 py-1 inline-flex items-center gap-1 disabled:opacity-50 ${a.cls}`}
          >
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      {/* Expand toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-[10px] font-display uppercase tracking-widest text-foreground/50 hover:text-foreground flex items-center gap-1 mt-1"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? "Hide details" : "Show details"}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 border-t-2 border-dashed border-foreground/20 pt-3">
          {/* Contact */}
          {event.contactName && (
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div className="font-bold">{event.contactName}</div>
              {event.contactEmail && (
                <a href={`mailto:${event.contactEmail}`} className="flex items-center gap-1.5 hover:underline md:truncate">
                  <Mail className="w-3.5 h-3.5 shrink-0" /> {event.contactEmail}
                </a>
              )}
              {event.contactPhone && (
                <a href={`tel:${event.contactPhone}`} className="flex items-center gap-1.5 hover:underline">
                  <Phone className="w-3.5 h-3.5 shrink-0" /> {event.contactPhone}
                </a>
              )}
              {event.promoContact && (
                <div className="col-span-2 text-xs bg-brand-cream border-2 border-foreground rounded-lg px-2 py-1">
                  Wants promo contact · {event.promoContactMethod || "not specified"}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="bg-brand-cream border-2 border-foreground rounded-lg p-3 text-sm">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Description</div>
              <p className="whitespace-pre-wrap leading-snug">{event.description}</p>
            </div>
          )}

          {/* Intake notes from submitter */}
          {event.intakeNotes && (
            <div className="bg-white border-2 border-foreground rounded-lg p-3 text-sm">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Submitter Notes</div>
              <p className="whitespace-pre-wrap leading-snug">{event.intakeNotes}</p>
            </div>
          )}

          {/* URL */}
          {event.url && (
            <a href={event.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm hover:underline md:truncate">
              <Globe className="w-3.5 h-3.5 shrink-0" /> {event.url}
            </a>
          )}

          {/* Admin notes */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">
              Admin Notes
            </label>
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              rows={3}
              className="w-full border-2 border-foreground rounded-lg px-3 py-2 text-sm resize-none bg-white focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              placeholder="Internal notes visible only to admins…"
            />
            <button
              type="button"
              disabled={saving || updateMutation.isPending}
              onClick={saveNotes}
              className="button-pop text-[10px] px-3 py-1 mt-1 bg-brand-cream disabled:opacity-50"
            >
              Save Notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EventsOpsPanel({ adminKey }: { adminKey: string }) {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");

  const reqOpts = { headers: { "x-admin-key": adminKey } };

  const { data: summary } = useGetAdminEventsSummary({
    query: { queryKey: getGetAdminEventsSummaryQueryKey(), refetchInterval: 30000 },
    request: reqOpts,
  });

  const eventsParams = statusFilter !== "all" ? { status: statusFilter } : undefined;
  const { data: eventsRaw, isLoading } = useListAdminEvents(
    eventsParams,
    {
      query: { queryKey: getListAdminEventsQueryKey(eventsParams), refetchInterval: 30000 },
      request: reqOpts,
    },
  );

  const events = useMemo(() => {
    const all = (eventsRaw as AdminEventRecord[] | undefined) ?? [];
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        (e.contactName ?? "").toLowerCase().includes(q) ||
        (e.contactEmail ?? "").toLowerCase().includes(q),
    );
  }, [eventsRaw, search]);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: getListAdminEventsQueryKey() });
    void qc.invalidateQueries({ queryKey: getGetAdminEventsSummaryQueryKey() });
  };

  return (
    <div>
      {summary && <SummaryBar summary={summary} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`button-pop text-sm px-3 py-1.5 ${statusFilter === tab.id ? "button-pop-yellow" : "bg-white"}`}
          >
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          onClick={refresh}
          className="button-pop text-sm px-3 py-1.5 bg-white inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by event name, venue, or contact…"
          className="w-full border-2 border-foreground rounded-lg pl-9 pr-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-yellow"
        />
      </div>

      {isLoading && (
        <div className="card-pop bg-white p-8 text-center text-sm">Loading events…</div>
      )}

      {!isLoading && events.length === 0 && (
        <div className="card-pop bg-white p-10 text-center">
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="font-black text-lg" style={{ fontFamily: "Bungee, sans-serif" }}>
            No events
          </p>
          <p className="text-sm text-foreground/70 mt-1">
            {search
              ? "No events match that search."
              : "No events in this status category."}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {events.map((ev) => (
          <AdminEventCard
            key={ev.id}
            event={ev}
            adminKey={adminKey}
            onUpdated={refresh}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main admin page ──────────────────────────────────────────────────────────

export default function AdminApplications() {
  const [unlocked, setUnlocked] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [tab, setTab] = useState<"business" | "event" | "events-ops">("business");

  useEffect(() => {
    if (sessionStorage.getItem(UNLOCK_KEY) === "1") {
      setUnlocked(true);
      setAdminKey(sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? ADMIN_PASSWORD);
    }
  }, []);

  const { data: appsRaw, isLoading } = useListApplications({
    query: {
      enabled: unlocked,
      queryKey: getListApplicationsQueryKey(),
      refetchInterval: 30000,
    },
  });
  const applications = (appsRaw as Application[] | undefined) ?? [];

  const businessApps = useMemo(
    () => applications.filter((a) => a.submissionType !== "event"),
    [applications],
  );
  const eventApps = useMemo(
    () => applications.filter((a) => a.submissionType === "event"),
    [applications],
  );

  const counts = useMemo(() => {
    return {
      starter: businessApps.filter((a) => a.package === "starter").length,
      featured: businessApps.filter((a) => a.package === "featured").length,
      premier: businessApps.filter((a) => a.package === "premier").length,
      route: businessApps.filter((a) => a.package === "route").length,
      custom: businessApps.filter((a) => a.package === "custom").length,
    };
  }, [businessApps]);

  if (!unlocked) {
    return (
      <AdminGate
        onUnlock={(key) => {
          setAdminKey(key);
          setUnlocked(true);
        }}
      />
    );
  }

  const shown = tab === "business" ? businessApps : eventApps;

  return (
    <div className="min-h-screen bg-[hsl(var(--brand-cream))] texture-paper py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <AdminNav onLock={() => setUnlocked(false)} />
        <div className="mb-4">
          <h1
            className="text-3xl font-black"
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            {tab === "events-ops" ? "Events Ops" : "Submissions"}
          </h1>
          <p className="text-xs text-foreground/60 mt-1">
            Notifications send to <strong>touristpassportatl@gmail.com</strong>.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            type="button"
            onClick={() => setTab("business")}
            className={`button-pop text-sm px-4 py-2 ${
              tab === "business" ? "button-pop-yellow" : "bg-white"
            }`}
          >
            Partner Applications ({businessApps.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("event")}
            className={`button-pop text-sm px-4 py-2 ${
              tab === "event" ? "button-pop-yellow" : "bg-white"
            }`}
          >
            Event Submissions ({eventApps.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("events-ops")}
            className={`button-pop text-sm px-4 py-2 ${
              tab === "events-ops" ? "button-pop-yellow" : "bg-white"
            }`}
          >
            Events Ops
          </button>
        </div>

        {/* Events Ops tab */}
        {tab === "events-ops" && <EventsOpsPanel adminKey={adminKey} />}

        {/* Applications tabs */}
        {tab !== "events-ops" && (
          <>
            {tab === "business" && businessApps.length > 0 && (
              <p className="text-sm text-foreground/70 mb-4">
                Starter {counts.starter} · Featured {counts.featured} · Premier{" "}
                {counts.premier} · Route {counts.route} · Custom {counts.custom}
              </p>
            )}

            {isLoading && (
              <div className="card-pop bg-white p-8 text-center text-sm">Loading…</div>
            )}

            {!isLoading && shown.length === 0 && (
              <div className="card-pop bg-white p-10 text-center">
                <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p
                  className="font-black text-lg"
                  style={{ fontFamily: "Bungee, sans-serif" }}
                >
                  {tab === "business" ? "No applications yet" : "No event submissions yet"}
                </p>
                <p className="text-sm text-foreground/70 mt-1">
                  {tab === "business"
                    ? "They'll show up here the moment someone submits the apply form."
                    : "They'll show up here the moment someone submits the List Your Event form."}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {shown.map((a) =>
                a.submissionType === "event" ? (
                  <EventCard key={a.id} app={a} />
                ) : (
                  <ApplicationCard key={a.id} app={a} />
                ),
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
