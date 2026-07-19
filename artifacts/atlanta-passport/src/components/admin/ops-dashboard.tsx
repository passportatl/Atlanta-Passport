// Sprint 4 ops UI: analytics dashboard, sync queue viewer, and admin
// notifications bell. Used by the admin applications page's Ops tab bar.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity, AlertTriangle, Bell, CheckCircle, Clock, Loader2,
  RefreshCw, XCircle, Zap,
} from "lucide-react";

const API_BASE = "/api";

// ── Types (match /admin/analytics/overview, /admin/sync-jobs, /admin/notifications)

type SourceHealth = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  healthStatus: string;
  disabledReason: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: string;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  backoffUntil: string | null;
  consecutiveFailures: number;
  avgResponseMs: number | null;
  priority: number;
  syncIntervalHours: number | null;
  totals: {
    runs: number;
    successfulRuns: number;
    fetched: number;
    inserted: number;
    updated: number;
    duplicates: number;
    rejected: number;
    parseFailures: number;
    authFailures: number;
    timeouts: number;
  };
};

type Overview = {
  generatedAt: string;
  queue: { queued: number; running: number; maxConcurrent: number };
  unreadNotifications: number;
  sources: SourceHealth[];
  eventCounts: { workflowStatus: string; ingestSourceId: string | null; count: number }[];
  recentRuns: {
    sourceId: string;
    status: string;
    count: number;
    found: number;
    inserted: number;
    changed: number;
    duplicates: number;
    errors: number;
  }[];
};

type SyncJob = {
  id: string;
  sourceId: string;
  sourceName: string;
  trigger: string;
  priority: number;
  status: string;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  retryCount: number;
  runId: string | null;
  result: string | null;
  errorMessage: string | null;
};

type AdminNotification = {
  id: string;
  type: string;
  severity: string;
  title: string;
  body: string | null;
  sourceId: string | null;
  readAt: string | null;
  createdAt: string;
};

// ── Shared helpers ────────────────────────────────────────────────────────────

async function apiGet<T>(path: string, adminKey: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: { "x-admin-key": adminKey } });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

const HEALTH_BADGE: Record<string, { label: string; cls: string }> = {
  healthy: { label: "Healthy", cls: "bg-brand-lime/30 text-green-800" },
  warning: { label: "Warning", cls: "bg-brand-yellow/40 text-yellow-900" },
  failed: { label: "Failed", cls: "bg-brand-red/20 text-brand-red" },
  disabled: { label: "Disabled", cls: "bg-foreground/10 text-foreground/60" },
  awaiting_credentials: { label: "Needs credentials", cls: "bg-orange-100 text-orange-800" },
  never_synced: { label: "Never synced", cls: "bg-foreground/10 text-foreground/60" },
};

const JOB_STATUS_CLS: Record<string, string> = {
  queued: "bg-brand-yellow/40 text-yellow-900",
  running: "bg-blue-100 text-blue-800",
  success: "bg-brand-lime/30 text-green-800",
  failed: "bg-brand-red/20 text-brand-red",
  cancelled: "bg-foreground/10 text-foreground/60",
  timeout: "bg-orange-100 text-orange-800",
};

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  critical: <XCircle className="w-4 h-4 text-brand-red shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />,
  info: <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />,
};

// ── NotificationsBell ─────────────────────────────────────────────────────────

export function NotificationsBell({ adminKey }: { adminKey: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = items.filter((n) => !n.readAt).length;

  const load = useCallback(() => {
    setLoading(true);
    apiGet<AdminNotification[]>("/admin/notifications", adminKey)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminKey]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markRead = async (id: string) => {
    await fetch(`${API_BASE}/admin/notifications/${id}/read`, {
      method: "POST",
      headers: { "x-admin-key": adminKey },
    }).catch(() => {});
    load();
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="button-pop bg-white text-foreground text-sm px-3 py-1.5 inline-flex items-center gap-1.5 relative"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-brand-red text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[90vw] bg-white border-2 border-foreground rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b-2 border-foreground/10">
            <span className="font-bold text-sm">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                className="text-xs underline text-foreground/60 hover:text-foreground"
                onClick={() => void markRead("all")}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[380px] overflow-y-auto">
            {loading && items.length === 0 && (
              <div className="p-4 text-sm text-foreground/50 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            )}
            {!loading && items.length === 0 && (
              <div className="p-4 text-sm text-foreground/50">No notifications yet.</div>
            )}
            {items.map((n) => (
              <button
                type="button"
                key={n.id}
                onClick={() => { if (!n.readAt) void markRead(n.id); }}
                className={`w-full text-left px-3 py-2.5 border-b border-foreground/5 flex gap-2 items-start hover:bg-foreground/5 ${n.readAt ? "opacity-60" : ""}`}
              >
                {SEVERITY_ICON[n.severity] ?? SEVERITY_ICON.info}
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-snug">{n.title}</span>
                  {n.body && <span className="block text-xs text-foreground/60 leading-snug mt-0.5 line-clamp-3">{n.body}</span>}
                  <span className="block text-[11px] text-foreground/40 mt-0.5">{timeAgo(n.createdAt)}</span>
                </span>
                {!n.readAt && <span className="ml-auto mt-1 w-2 h-2 rounded-full bg-brand-red shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── OpsDashboardPanel ─────────────────────────────────────────────────────────

export function OpsDashboardPanel({ adminKey }: { adminKey: string }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [queue, setQueue] = useState<{ queued: number; running: number; maxConcurrent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    Promise.all([
      apiGet<Overview>("/admin/analytics/overview", adminKey),
      apiGet<{ queue: Overview["queue"]; jobs: SyncJob[] }>("/admin/sync-jobs?limit=25", adminKey),
    ])
      .then(([ov, sj]) => {
        setOverview(ov);
        setJobs(sj.jobs);
        setQueue(sj.queue);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [adminKey]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const cancelQueued = async (id: string) => {
    await fetch(`${API_BASE}/admin/sync-jobs/${id}/cancel`, {
      method: "POST",
      headers: { "x-admin-key": adminKey },
    }).catch(() => {});
    load();
  };

  if (loading) {
    return (
      <div className="p-8 text-foreground/50 flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading dashboard…
      </div>
    );
  }
  if (error || !overview) {
    return <div className="p-6 text-brand-red text-sm">⚠️ {error ?? "No data"}</div>;
  }

  const totals = overview.sources.reduce(
    (acc, s) => ({
      fetched: acc.fetched + s.totals.fetched,
      inserted: acc.inserted + s.totals.inserted,
      duplicates: acc.duplicates + s.totals.duplicates,
      rejected: acc.rejected + s.totals.rejected,
      runs: acc.runs + s.totals.runs,
      successfulRuns: acc.successfulRuns + s.totals.successfulRuns,
    }),
    { fetched: 0, inserted: 0, duplicates: 0, rejected: 0, runs: 0, successfulRuns: 0 },
  );
  const successRate = totals.runs > 0 ? Math.round((totals.successfulRuns / totals.runs) * 100) : null;

  const pendingReview = overview.eventCounts
    .filter((c) => c.workflowStatus === "pending" && c.ingestSourceId)
    .reduce((a, c) => a + c.count, 0);
  const possibleDupes = overview.eventCounts
    .filter((c) => c.workflowStatus === "possible_duplicate")
    .reduce((a, c) => a + c.count, 0);

  const statCards: { label: string; value: string | number; icon: React.ReactNode }[] = [
    { label: "Events fetched (lifetime)", value: totals.fetched.toLocaleString(), icon: <Activity className="w-4 h-4" /> },
    { label: "Inserted", value: totals.inserted.toLocaleString(), icon: <CheckCircle className="w-4 h-4" /> },
    { label: "Duplicates caught", value: totals.duplicates.toLocaleString(), icon: <AlertTriangle className="w-4 h-4" /> },
    { label: "Rejected (integrity)", value: totals.rejected.toLocaleString(), icon: <XCircle className="w-4 h-4" /> },
    { label: "Run success rate", value: successRate === null ? "—" : `${successRate}%`, icon: <Zap className="w-4 h-4" /> },
    { label: "Awaiting review", value: pendingReview.toLocaleString(), icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((c) => (
          <div key={c.label} className="bg-white border-2 border-foreground rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-foreground/50 text-[11px] font-semibold uppercase tracking-wide">
              {c.icon} {c.label}
            </div>
            <div className="text-2xl font-black mt-1" style={{ fontFamily: "Bungee, sans-serif" }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {possibleDupes > 0 && (
        <div className="bg-brand-yellow/20 border-2 border-brand-yellow rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-700" />
          {possibleDupes} possible duplicate{possibleDupes !== 1 ? "s" : ""} waiting in the Duplicates tab.
        </div>
      )}

      {/* Source health table */}
      <div className="bg-white border-2 border-foreground rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b-2 border-foreground/10 flex items-center justify-between">
          <h3 className="font-black text-base" style={{ fontFamily: "Bungee, sans-serif" }}>Source Health</h3>
          <button type="button" onClick={load} className="button-pop bg-white text-foreground text-xs px-2.5 py-1 inline-flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-foreground/50 border-b border-foreground/10">
                <th className="px-4 py-2">Source</th>
                <th className="px-2 py-2">Health</th>
                <th className="px-2 py-2">Last success</th>
                <th className="px-2 py-2">Fails</th>
                <th className="px-2 py-2">Avg resp</th>
                <th className="px-2 py-2">Fetched</th>
                <th className="px-2 py-2">Inserted</th>
                <th className="px-2 py-2">Dupes</th>
                <th className="px-2 py-2">Rejected</th>
                <th className="px-2 py-2">Backoff</th>
              </tr>
            </thead>
            <tbody>
              {overview.sources.map((s) => {
                const badge = HEALTH_BADGE[s.healthStatus] ?? HEALTH_BADGE.never_synced;
                const inBackoff = s.backoffUntil && new Date(s.backoffUntil).getTime() > Date.now();
                return (
                  <tr key={s.id} className="border-b border-foreground/5">
                    <td className="px-4 py-2 font-semibold whitespace-nowrap">
                      {s.name}
                      {!s.isActive && <span className="ml-1.5 text-[10px] text-foreground/40">(inactive)</span>}
                    </td>
                    <td className="px-2 py-2">
                      <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`} title={s.disabledReason ?? undefined}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-foreground/70">{timeAgo(s.lastSuccessAt)}</td>
                    <td className={`px-2 py-2 ${s.consecutiveFailures > 0 ? "text-brand-red font-bold" : "text-foreground/70"}`}>{s.consecutiveFailures}</td>
                    <td className="px-2 py-2 text-foreground/70">{s.avgResponseMs != null ? `${s.avgResponseMs}ms` : "—"}</td>
                    <td className="px-2 py-2 text-foreground/70">{s.totals.fetched.toLocaleString()}</td>
                    <td className="px-2 py-2 text-foreground/70">{s.totals.inserted.toLocaleString()}</td>
                    <td className="px-2 py-2 text-foreground/70">{s.totals.duplicates.toLocaleString()}</td>
                    <td className="px-2 py-2 text-foreground/70">{s.totals.rejected.toLocaleString()}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-foreground/70">
                      {inBackoff ? `until ${new Date(s.backoffUntil!).toLocaleTimeString()}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync queue */}
      <div className="bg-white border-2 border-foreground rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b-2 border-foreground/10 flex items-center gap-3">
          <h3 className="font-black text-base" style={{ fontFamily: "Bungee, sans-serif" }}>Sync Queue</h3>
          {queue && (
            <span className="text-xs text-foreground/50 font-semibold">
              {queue.running} running / {queue.queued} queued (max {queue.maxConcurrent} concurrent)
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-foreground/50 border-b border-foreground/10">
                <th className="px-4 py-2">Source</th>
                <th className="px-2 py-2">Trigger</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Queued</th>
                <th className="px-2 py-2">Duration</th>
                <th className="px-2 py-2">Result</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-4 text-foreground/50">No sync jobs yet.</td></tr>
              )}
              {jobs.map((j) => (
                <tr key={j.id} className="border-b border-foreground/5">
                  <td className="px-4 py-2 font-semibold whitespace-nowrap">{j.sourceName}</td>
                  <td className="px-2 py-2 text-foreground/70">{j.trigger}</td>
                  <td className="px-2 py-2">
                    <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${JOB_STATUS_CLS[j.status] ?? "bg-foreground/10"}`}>
                      {j.status}{j.retryCount > 0 ? ` (retry ${j.retryCount})` : ""}
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-foreground/70">{timeAgo(j.queuedAt)}</td>
                  <td className="px-2 py-2 text-foreground/70">{j.durationMs != null ? `${(j.durationMs / 1000).toFixed(1)}s` : "—"}</td>
                  <td className="px-2 py-2 text-foreground/70 max-w-[260px] truncate" title={j.errorMessage ?? j.result ?? undefined}>
                    {j.errorMessage ?? j.result ?? "—"}
                  </td>
                  <td className="px-2 py-2">
                    {j.status === "queued" && (
                      <button
                        type="button"
                        onClick={() => void cancelQueued(j.id)}
                        className="text-xs underline text-brand-red"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
