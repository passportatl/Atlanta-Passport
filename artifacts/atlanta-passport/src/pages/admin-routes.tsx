import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2, Search, CheckCircle, AlertTriangle, Upload, FileText,
  RefreshCw, ChevronDown, ChevronUp, Route, Plus, Trash2, Copy,
  Download, MapPin, Clock, Bike, Footprints, Star, Building2,
  GripVertical, Check, X, Archive, Eye, Edit3,
} from "lucide-react";
import AdminNav from "@/components/AdminNav";
import { cn } from "@/lib/utils";

const API_BASE = "/api";
const ADMIN_KEY_STORAGE = "atl-passport-admin-key";
const UNLOCK_KEY = "atlanta-passport-admin-unlocked";
const ADMIN_PASSWORD = "atlanta2026";

// ── Types ─────────────────────────────────────────────────────────────────────

type RouteStop = {
  id: string;
  routeId: string;
  businessSlug: string | null;
  orderIndex: number;
  morningOrder: number | null;
  noonOrder: number | null;
  nightOrder: number | null;
  customName: string | null;
  customDescription: string | null;
  stopNote: string | null;
  visitMinutesOverride: number | null;
  hasStamp: boolean;
};

type MasterRoute = {
  id: string;
  slug: string;
  name: string;
  area: string | null;
  vibe: string | null;
  description: string | null;
  heroImage: string | null;
  color: string;
  pace: string;
  transportationVariants: string[] | null;
  durationMinutes: number | null;
  distanceMiles: string | null;
  ageGuidance: string | null;
  timeOfDayGuidance: string | null;
  startMartaName: string | null;
  startMartaLat: number | null;
  startMartaLng: number | null;
  startParkingName: string | null;
  startParkingLat: number | null;
  startParkingLng: number | null;
  workflowStatus: string;
  publishedAt: string | null;
  archivedAt: string | null;
  scheduledPublishAt: string | null;
  isFeatured: boolean;
  isSponsored: boolean;
  sponsorName: string | null;
  sponsorTier: string | null;
  sponsorId: string | null;
  relatedExperienceSlug: string | null;
  relatedEventIds: string[] | null;
  relatedLocationSlugs: string[] | null;
  relatedLegendSlugs: string[] | null;
  relatedStampSlugs: string[] | null;
  relatedRewardIds: string[] | null;
  adminNotes: string | null;
  completenessScore: number | null;
  isDuplicate: boolean;
  duplicateOfId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
  stops: RouteStop[];
};

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchRoutes(
  adminKey: string,
  params: Record<string, string> = {},
): Promise<MasterRoute[]> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/admin/routes${qs ? `?${qs}` : ""}`, {
    headers: { "x-admin-key": adminKey },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<MasterRoute[]>;
}

async function createRoute(adminKey: string, data: Record<string, unknown>): Promise<MasterRoute> {
  const res = await fetch(`${API_BASE}/admin/routes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<MasterRoute>;
}

async function patchRoute(
  id: string,
  patch: Record<string, unknown>,
  adminKey: string,
): Promise<MasterRoute> {
  const res = await fetch(`${API_BASE}/admin/routes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<MasterRoute>;
}

async function deleteRoute(id: string, adminKey: string): Promise<void> {
  await fetch(`${API_BASE}/admin/routes/${id}`, {
    method: "DELETE",
    headers: { "x-admin-key": adminKey },
  });
}

async function duplicateRoute(id: string, adminKey: string): Promise<MasterRoute> {
  const res = await fetch(`${API_BASE}/admin/routes/${id}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<MasterRoute>;
}

async function addStop(
  routeId: string,
  stop: Record<string, unknown>,
  adminKey: string,
): Promise<RouteStop> {
  const res = await fetch(`${API_BASE}/admin/routes/${routeId}/stops`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify(stop),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<RouteStop>;
}

async function updateStop(
  routeId: string,
  stopId: string,
  patch: Record<string, unknown>,
  adminKey: string,
): Promise<RouteStop> {
  const res = await fetch(`${API_BASE}/admin/routes/${routeId}/stops/${stopId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<RouteStop>;
}

async function removeStop(
  routeId: string,
  stopId: string,
  adminKey: string,
): Promise<void> {
  await fetch(`${API_BASE}/admin/routes/${routeId}/stops/${stopId}`, {
    method: "DELETE",
    headers: { "x-admin-key": adminKey },
  });
}

async function migrateSample(adminKey: string): Promise<{
  migrated: number;
  skipped: number;
  errors: number;
  total: number;
  report: Array<{ slug: string; name: string; status: string; reason?: string; stopsInserted?: number }>;
}> {
  const res = await fetch(`${API_BASE}/admin/routes/migrate-sample`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<{
    migrated: number; skipped: number; errors: number; total: number;
    report: Array<{ slug: string; name: string; status: string; reason?: string; stopsInserted?: number }>;
  }>;
}

// ── Small UI helpers ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700" },
  published: { label: "Published", color: "bg-green-100 text-green-700" },
  archived: { label: "Archived", color: "bg-red-100 text-red-700" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide", cfg.color)}>
      {cfg.label}
    </span>
  );
}

function CompletenessBar({ score }: { score: number | null }) {
  const pct = score ?? 0;
  const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-foreground/50 w-7 text-right">{pct}%</span>
    </div>
  );
}

const COLOR_OPTIONS = [
  { value: "yellow", label: "Yellow", cls: "bg-brand-yellow" },
  { value: "red", label: "Red", cls: "bg-brand-red" },
  { value: "lime", label: "Lime", cls: "bg-brand-lime" },
  { value: "sky", label: "Sky", cls: "bg-brand-sky" },
  { value: "orange", label: "Orange", cls: "bg-brand-orange" },
  { value: "navy", label: "Navy", cls: "bg-brand-navy" },
];

// ── Stops Editor ──────────────────────────────────────────────────────────────

function StopsEditor({
  route,
  adminKey,
  onUpdated,
}: {
  route: MasterRoute;
  adminKey: string;
  onUpdated: () => void;
}) {
  const [stops, setStops] = useState<RouteStop[]>(route.stops ?? []);
  const [newSlug, setNewSlug] = useState("");
  const [newNote, setNewNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const doAdd = async () => {
    if (!newSlug.trim()) return;
    setAdding(true);
    try {
      const stop = await addStop(
        route.id,
        {
          businessSlug: newSlug.trim(),
          orderIndex: stops.length,
          morningOrder: stops.length + 1,
          noonOrder: stops.length + 1,
          nightOrder: stops.length + 1,
          stopNote: newNote.trim() || undefined,
        },
        adminKey,
      );
      setStops((prev) => [...prev, stop]);
      setNewSlug("");
      setNewNote("");
      onUpdated();
    } finally {
      setAdding(false);
    }
  };

  const doRemove = async (stopId: string) => {
    setSaving(stopId);
    try {
      await removeStop(route.id, stopId, adminKey);
      setStops((prev) => prev.filter((s) => s.id !== stopId));
      onUpdated();
    } finally {
      setSaving(null);
    }
  };

  const doUpdateNote = async (stop: RouteStop, note: string) => {
    setSaving(stop.id);
    try {
      const updated = await updateStop(route.id, stop.id, { stopNote: note }, adminKey);
      setStops((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="font-bold text-xs uppercase tracking-wide text-foreground/50">
        Stops ({stops.length})
      </div>
      <div className="space-y-2">
        {stops
          .slice()
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((stop, idx) => (
            <StopRow
              key={stop.id}
              stop={stop}
              idx={idx}
              saving={saving === stop.id}
              onRemove={() => doRemove(stop.id)}
              onUpdateNote={(note) => doUpdateNote(stop, note)}
            />
          ))}
      </div>
      <div className="flex gap-2 pt-1">
        <input
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
          placeholder="business-slug (e.g. wheelhaus-bikes)"
          className="flex-1 border-2 border-foreground rounded-lg px-3 py-1.5 text-xs font-mono bg-white"
          onKeyDown={(e) => e.key === "Enter" && doAdd()}
        />
        <input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Turn-by-turn note (optional)"
          className="flex-1 border-2 border-foreground rounded-lg px-3 py-1.5 text-xs bg-white"
          onKeyDown={(e) => e.key === "Enter" && doAdd()}
        />
        <button
          type="button"
          disabled={adding || !newSlug.trim()}
          onClick={doAdd}
          className="button-pop bg-brand-navy text-white text-xs px-4 py-1.5 font-bold uppercase disabled:opacity-50 inline-flex items-center gap-1"
        >
          {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Add
        </button>
      </div>
    </div>
  );
}

function StopRow({
  stop,
  idx,
  saving,
  onRemove,
  onUpdateNote,
}: {
  stop: RouteStop;
  idx: number;
  saving: boolean;
  onRemove: () => void;
  onUpdateNote: (note: string) => void;
}) {
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(stop.stopNote ?? "");

  return (
    <div className="flex items-start gap-2 p-2 bg-foreground/3 rounded-lg border border-foreground/10">
      <GripVertical className="w-4 h-4 text-foreground/30 mt-0.5 shrink-0 cursor-grab" />
      <span className="w-5 h-5 rounded-full bg-foreground text-brand-yellow font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">
        {idx + 1}
      </span>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="font-mono text-xs font-bold truncate">{stop.businessSlug ?? stop.customName ?? "—"}</div>
        {editingNote ? (
          <div className="flex gap-1">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex-1 border border-foreground/30 rounded px-2 py-0.5 text-xs bg-white"
              autoFocus
            />
            <button
              type="button"
              onClick={() => { onUpdateNote(note); setEditingNote(false); }}
              className="text-green-700 p-0.5"
            >
              <Check className="w-3 h-3" />
            </button>
            <button type="button" onClick={() => { setNote(stop.stopNote ?? ""); setEditingNote(false); }} className="text-red-700 p-0.5">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingNote(true)}
            className="text-[10px] text-foreground/50 hover:text-foreground text-left truncate max-w-full"
          >
            {stop.stopNote ? `"${stop.stopNote}"` : "＋ add turn-by-turn note"}
          </button>
        )}
        {(stop.morningOrder != null || stop.noonOrder != null || stop.nightOrder != null) && (
          <div className="flex gap-2 text-[9px] font-bold text-foreground/40 uppercase">
            {stop.morningOrder != null && <span>☀ #{stop.morningOrder}</span>}
            {stop.noonOrder != null && <span>☁ #{stop.noonOrder}</span>}
            {stop.nightOrder != null && <span>🌙 #{stop.nightOrder}</span>}
          </div>
        )}
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={onRemove}
        className="text-red-500 hover:text-red-700 p-1 shrink-0 disabled:opacity-40"
      >
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
      </button>
    </div>
  );
}

// ── Route Card ────────────────────────────────────────────────────────────────

function RouteCard({
  route,
  adminKey,
  onUpdated,
}: {
  route: MasterRoute;
  adminKey: string;
  onUpdated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState(route.workflowStatus);
  const [editName, setEditName] = useState(route.name);
  const [editArea, setEditArea] = useState(route.area ?? "");
  const [editVibe, setEditVibe] = useState(route.vibe ?? "");
  const [editDesc, setEditDesc] = useState(route.description ?? "");
  const [editColor, setEditColor] = useState(route.color);
  const [editPace, setEditPace] = useState(route.pace);
  const [editDuration, setEditDuration] = useState(route.durationMinutes?.toString() ?? "");
  const [editDistance, setEditDistance] = useState(route.distanceMiles ?? "");
  const [editAgeGuide, setEditAgeGuide] = useState(route.ageGuidance ?? "");
  const [editTimeGuide, setEditTimeGuide] = useState(route.timeOfDayGuidance ?? "");
  const [editMartaName, setEditMartaName] = useState(route.startMartaName ?? "");
  const [editMartaLat, setEditMartaLat] = useState(route.startMartaLat?.toString() ?? "");
  const [editMartaLng, setEditMartaLng] = useState(route.startMartaLng?.toString() ?? "");
  const [editParkingName, setEditParkingName] = useState(route.startParkingName ?? "");
  const [editSponsor, setEditSponsor] = useState(route.sponsorName ?? "");
  const [editSponsorTier, setEditSponsorTier] = useState(route.sponsorTier ?? "");
  const [editNotes, setEditNotes] = useState(route.adminNotes ?? "");
  const [editFeatured, setEditFeatured] = useState(route.isFeatured);
  const [editSponsored, setEditSponsored] = useState(route.isSponsored);
  const [dupMsg, setDupMsg] = useState("");

  const doSave = async () => {
    setSaving(true);
    try {
      await patchRoute(
        route.id,
        {
          workflowStatus: editStatus,
          name: editName,
          area: editArea || null,
          vibe: editVibe || null,
          description: editDesc || null,
          color: editColor,
          pace: editPace,
          durationMinutes: editDuration ? Number(editDuration) : null,
          distanceMiles: editDistance || null,
          ageGuidance: editAgeGuide || null,
          timeOfDayGuidance: editTimeGuide || null,
          startMartaName: editMartaName || null,
          startMartaLat: editMartaLat ? Number(editMartaLat) : null,
          startMartaLng: editMartaLng ? Number(editMartaLng) : null,
          startParkingName: editParkingName || null,
          sponsorName: editSponsor || null,
          sponsorTier: editSponsorTier || null,
          adminNotes: editNotes || null,
          isFeatured: editFeatured,
          isSponsored: editSponsored,
        },
        adminKey,
      );
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const doDuplicate = async () => {
    setSaving(true);
    setDupMsg("");
    try {
      await duplicateRoute(route.id, adminKey);
      setDupMsg("✓ Duplicate created");
      onUpdated();
    } catch (err) {
      setDupMsg(`✗ ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const doArchive = async () => {
    if (!confirm(`Archive "${route.name}"? It will be hidden from the public.`)) return;
    setSaving(true);
    try {
      await deleteRoute(route.id, adminKey);
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const PaceIcon = route.pace === "Bike Friendly" ? Bike : Footprints;

  return (
    <div className="card-pop bg-white">
      {/* Header */}
      <div className="flex items-start gap-3 p-3">
        <div
          className="w-10 h-10 rounded-xl border-2 border-foreground shrink-0 flex items-center justify-center text-xs font-black"
          style={{
            backgroundColor:
              route.color === "red" ? "hsl(var(--brand-red))" :
              route.color === "lime" ? "hsl(var(--brand-lime))" :
              route.color === "sky" ? "hsl(var(--brand-sky))" :
              route.color === "orange" ? "hsl(var(--brand-orange))" :
              route.color === "navy" ? "hsl(var(--brand-navy))" :
              "hsl(var(--brand-yellow))",
            color: ["navy","red","orange"].includes(route.color) ? "white" : "black",
          }}
        >
          <Route className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="font-black text-sm truncate">{route.name}</span>
            <StatusBadge status={route.workflowStatus} />
            {route.isFeatured && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-brand-yellow text-foreground">
                <Star className="w-2.5 h-2.5" /> Featured
              </span>
            )}
          </div>
          {route.area && <div className="text-xs text-foreground/60 font-medium">{route.area}</div>}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[10px] text-foreground/50">
            <span className="flex items-center gap-1"><PaceIcon className="w-3 h-3" />{route.pace}</span>
            {route.stops?.length > 0 && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{route.stops.length} stops</span>}
            {route.durationMinutes && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{route.durationMinutes} min</span>}
          </div>
          <div className="mt-1.5">
            <CompletenessBar score={route.completenessScore} />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={saving}
            onClick={doDuplicate}
            title="Duplicate"
            className="p-1.5 text-foreground/40 hover:text-foreground/70"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={doArchive}
            title="Archive"
            className="p-1.5 text-foreground/40 hover:text-red-600"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-foreground/50 hover:text-foreground"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {dupMsg && (
        <div className={cn("mx-3 mb-2 text-xs px-3 py-1.5 rounded-lg font-medium", dupMsg.startsWith("✓") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
          {dupMsg}
        </div>
      )}

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t-2 border-foreground/10 p-4 space-y-5">
          {/* Quick workflow */}
          <div className="flex flex-wrap gap-2">
            {["draft","published","archived"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setEditStatus(s); }}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold uppercase border-2 transition-colors",
                  editStatus === s ? "border-foreground bg-foreground text-background" : "border-foreground/20 bg-white text-foreground/60 hover:border-foreground/50",
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Core fields */}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-foreground/50 mb-1">Route Name *</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border-2 border-foreground rounded-lg px-3 py-1.5 text-sm bg-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-foreground/50 mb-1">Area / Neighborhood</label>
              <input value={editArea} onChange={(e) => setEditArea(e.target.value)} placeholder="e.g. West End → Castleberry" className="w-full border-2 border-foreground rounded-lg px-3 py-1.5 text-sm bg-white" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-foreground/50 mb-1">Vibe / Tagline</label>
            <input value={editVibe} onChange={(e) => setEditVibe(e.target.value)} placeholder="Short compelling description shown on the route card" className="w-full border-2 border-foreground rounded-lg px-3 py-1.5 text-sm bg-white" />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-foreground/50 mb-1">Full Description</label>
            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} placeholder="Detailed description, logistics, transit instructions…" className="w-full border-2 border-foreground rounded-lg px-3 py-1.5 text-sm bg-white resize-none" />
          </div>

          {/* Metadata */}
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-foreground/50 mb-1">Pace</label>
              <select value={editPace} onChange={(e) => setEditPace(e.target.value)} className="w-full border-2 border-foreground rounded-lg px-3 py-1.5 text-sm bg-white">
                <option value="Walkable">Walkable</option>
                <option value="Bike Friendly">Bike Friendly</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-foreground/50 mb-1">Duration (min)</label>
              <input type="number" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} placeholder="e.g. 240" className="w-full border-2 border-foreground rounded-lg px-3 py-1.5 text-sm bg-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-foreground/50 mb-1">Distance</label>
              <input value={editDistance} onChange={(e) => setEditDistance(e.target.value)} placeholder="e.g. 4.2 mi" className="w-full border-2 border-foreground rounded-lg px-3 py-1.5 text-sm bg-white" />
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-foreground/50 mb-2">Card Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setEditColor(c.value)}
                  title={c.label}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    c.cls,
                    editColor === c.value ? "border-foreground scale-110" : "border-transparent",
                  )}
                />
              ))}
            </div>
          </div>

          {/* Guidance */}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-foreground/50 mb-1">Age Guidance</label>
              <input value={editAgeGuide} onChange={(e) => setEditAgeGuide(e.target.value)} placeholder="e.g. All ages · 21+ for most stops" className="w-full border-2 border-foreground rounded-lg px-3 py-1.5 text-sm bg-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-foreground/50 mb-1">Time of Day Guidance</label>
              <input value={editTimeGuide} onChange={(e) => setEditTimeGuide(e.target.value)} placeholder="e.g. Best after 3pm" className="w-full border-2 border-foreground rounded-lg px-3 py-1.5 text-sm bg-white" />
            </div>
          </div>

          {/* Start points */}
          <div>
            <div className="font-bold text-[10px] uppercase tracking-wide text-foreground/50 mb-2">Start Points</div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 p-3 bg-brand-cream rounded-xl border border-foreground/20">
                <div className="text-xs font-bold flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> MARTA / Transit Start</div>
                <input value={editMartaName} onChange={(e) => setEditMartaName(e.target.value)} placeholder="Station name" className="w-full border-2 border-foreground rounded-lg px-2 py-1 text-xs bg-white" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={editMartaLat} onChange={(e) => setEditMartaLat(e.target.value)} placeholder="Lat" className="border-2 border-foreground rounded-lg px-2 py-1 text-xs bg-white font-mono" />
                  <input value={editMartaLng} onChange={(e) => setEditMartaLng(e.target.value)} placeholder="Lng" className="border-2 border-foreground rounded-lg px-2 py-1 text-xs bg-white font-mono" />
                </div>
              </div>
              <div className="space-y-2 p-3 bg-brand-cream rounded-xl border border-foreground/20">
                <div className="text-xs font-bold flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Parking / Drive Start</div>
                <input value={editParkingName} onChange={(e) => setEditParkingName(e.target.value)} placeholder="Parking lot or landmark name" className="w-full border-2 border-foreground rounded-lg px-2 py-1 text-xs bg-white" />
              </div>
            </div>
          </div>

          {/* Sponsor */}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-foreground/50 mb-1">Sponsor Name</label>
              <input value={editSponsor} onChange={(e) => setEditSponsor(e.target.value)} className="w-full border-2 border-foreground rounded-lg px-3 py-1.5 text-sm bg-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-foreground/50 mb-1">Sponsor Tier</label>
              <select value={editSponsorTier} onChange={(e) => setEditSponsorTier(e.target.value)} className="w-full border-2 border-foreground rounded-lg px-3 py-1.5 text-sm bg-white">
                <option value="">None</option>
                <option value="Founding Sponsor">Founding Sponsor</option>
                <option value="Premier Sponsor">Premier Sponsor</option>
                <option value="Supporting Sponsor">Supporting Sponsor</option>
              </select>
            </div>
          </div>

          {/* Flags */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editFeatured} onChange={(e) => setEditFeatured(e.target.checked)} className="w-4 h-4" />
              <span className="text-xs font-bold">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editSponsored} onChange={(e) => setEditSponsored(e.target.checked)} className="w-4 h-4" />
              <span className="text-xs font-bold">Sponsored</span>
            </label>
          </div>

          {/* Admin notes */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-foreground/50 mb-1">Admin Notes</label>
            <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} className="w-full border-2 border-foreground rounded-lg px-3 py-1.5 text-xs bg-white resize-none" />
          </div>

          {/* Stops editor */}
          <div className="border-t border-foreground/10 pt-4">
            <StopsEditor route={route} adminKey={adminKey} onUpdated={onUpdated} />
          </div>

          {/* Save */}
          <div className="flex gap-2 pt-2 border-t border-foreground/10">
            <button
              type="button"
              disabled={saving}
              onClick={doSave}
              className="button-pop bg-brand-navy text-white text-xs px-5 py-2.5 font-bold uppercase tracking-wide disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </button>
            <a
              href={`/routes/${route.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="button-pop bg-white text-foreground text-xs px-4 py-2.5 font-bold uppercase tracking-wide inline-flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Routes Tab ────────────────────────────────────────────────────────────────

function RoutesTab({ adminKey }: { adminKey: string }) {
  const [routes, setRoutes] = useState<MasterRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (search) params.search = search;
      if (paceFilter) params.pace = paceFilter;
      const data = await fetchRoutes(adminKey, params);
      setRoutes(data);
    } finally {
      setLoading(false);
    }
  }, [adminKey, statusFilter, search, paceFilter]);

  useEffect(() => { void load(); }, [load]);

  const doCreate = async () => {
    setCreating(true);
    try {
      await createRoute(adminKey, { name: "New Route", workflowStatus: "draft" });
      await load();
    } finally {
      setCreating(false);
    }
  };

  const published = routes.filter((r) => r.workflowStatus === "published").length;
  const draft = routes.filter((r) => r.workflowStatus === "draft").length;
  const withStops = routes.filter((r) => (r.stops?.length ?? 0) >= 3).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Routes", value: routes.length },
          { label: "Published", value: published },
          { label: "With 3+ Stops", value: withStops },
        ].map((s) => (
          <div key={s.label} className="p-3 bg-brand-cream rounded-xl border-2 border-foreground/20 text-center">
            <div className="text-2xl font-black">{s.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-foreground/50">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search routes…"
            className="w-full border-2 border-foreground rounded-xl pl-8 pr-3 py-2 text-sm bg-white"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border-2 border-foreground rounded-xl px-3 py-2 text-sm bg-white font-bold">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select value={paceFilter} onChange={(e) => setPaceFilter(e.target.value)} className="border-2 border-foreground rounded-xl px-3 py-2 text-sm bg-white font-bold">
          <option value="">All paces</option>
          <option value="Walkable">Walkable</option>
          <option value="Bike Friendly">Bike Friendly</option>
        </select>
        <button type="button" onClick={() => void load()} className="button-pop bg-white px-3 py-2">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button type="button" disabled={creating} onClick={doCreate} className="button-pop bg-brand-navy text-white px-4 py-2 font-display text-xs tracking-widest uppercase inline-flex items-center gap-1.5 disabled:opacity-50">
          {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          New Route
        </button>
        <a
          href={`${API_BASE}/admin/routes/export.csv?_k=${encodeURIComponent(adminKey)}`}
          className="button-pop bg-white px-3 py-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase"
        >
          <Download className="w-3.5 h-3.5" /> CSV
        </a>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
        </div>
      ) : routes.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Route className="w-10 h-10 mx-auto opacity-30" />
          <p className="font-black text-lg" style={{ fontFamily: "Bungee, sans-serif" }}>NO ROUTES FOUND</p>
          <p className="text-sm text-foreground/60">Try adjusting filters, or migrate the existing routes from the Migration tab.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {routes.map((r) => (
            <RouteCard key={r.id} route={r} adminKey={adminKey} onUpdated={() => void load()} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Migration Tab ─────────────────────────────────────────────────────────────

function MigrationTab({ adminKey }: { adminKey: string }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    migrated: number; skipped: number; errors: number; total: number;
    report: Array<{ slug: string; name: string; status: string; reason?: string; stopsInserted?: number }>;
  } | null>(null);

  const doMigrate = async () => {
    if (!confirm("Migrate the 5 existing hardcoded routes into the master database? This is non-destructive — already-migrated routes will be skipped.")) return;
    setRunning(true);
    try {
      const r = await migrateSample(adminKey);
      setResult(r);
    } catch (err) {
      alert(`Migration failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-pop bg-white p-6 space-y-4">
        <div>
          <h3 className="font-black text-lg" style={{ fontFamily: "Bungee, sans-serif" }}>
            MIGRATE FROM SAMPLE DATA
          </h3>
          <p className="text-sm text-foreground/70 mt-1">
            This one-time utility reads the 5 original routes hardcoded in the frontend and writes them as master records in the database. Runs non-destructively — routes that are already in the database are skipped. After migration you can edit, reorder, and extend them through this admin hub without touching the codebase.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: "Nakato Route", area: "Midtown → Cheshire Bridge", stops: 6, pace: "Bike Friendly" },
            { name: "Varasano's Route", area: "Lindbergh → Buckhead", stops: 4, pace: "Bike Friendly" },
            { name: "Wheelhaus Route", area: "Glenwood → Grant Park", stops: 6, pace: "Bike Friendly" },
            { name: "Trap Music Museum Route", area: "West End → Westside BeltLine", stops: 8, pace: "Bike Friendly" },
            { name: "Peachtree Wellness Route", area: "Oakland → Cabbagetown", stops: 7, pace: "Walkable" },
          ].map((r) => (
            <div key={r.name} className="p-3 bg-brand-cream rounded-xl border border-foreground/20 space-y-1">
              <div className="font-bold text-xs">{r.name}</div>
              <div className="text-[10px] text-foreground/60">{r.area} · {r.stops} stops · {r.pace}</div>
            </div>
          ))}
        </div>

        <button
          type="button"
          disabled={running}
          onClick={doMigrate}
          className="button-pop bg-brand-green text-white px-6 py-3 font-display text-sm tracking-widest uppercase inline-flex items-center gap-2 disabled:opacity-50"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {running ? "Migrating…" : "Migrate 5 Sample Routes"}
        </button>

        {result && (
          <div className="space-y-3 border-t border-foreground/10 pt-4">
            <div className="flex flex-wrap gap-4">
              <div className="text-center px-5 py-3 bg-green-50 rounded-xl border-2 border-green-200">
                <div className="text-2xl font-black text-green-700">{result.migrated}</div>
                <div className="text-[10px] font-bold text-green-600 uppercase">Migrated</div>
              </div>
              <div className="text-center px-5 py-3 bg-brand-yellow/20 rounded-xl border-2 border-brand-yellow/40">
                <div className="text-2xl font-black text-amber-700">{result.skipped}</div>
                <div className="text-[10px] font-bold text-amber-600 uppercase">Skipped</div>
              </div>
              <div className="text-center px-5 py-3 bg-red-50 rounded-xl border-2 border-red-200">
                <div className="text-2xl font-black text-red-700">{result.errors}</div>
                <div className="text-[10px] font-bold text-red-600 uppercase">Errors</div>
              </div>
            </div>
            <div className="space-y-1.5">
              {result.report.map((r) => (
                <div
                  key={r.slug}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-xs",
                    r.status === "migrated" ? "bg-green-50" :
                    r.status === "skipped" ? "bg-yellow-50" : "bg-red-50",
                  )}
                >
                  <span className={cn("font-bold shrink-0",
                    r.status === "migrated" ? "text-green-700" :
                    r.status === "skipped" ? "text-amber-700" : "text-red-700"
                  )}>
                    {r.status === "migrated" ? "✓" : r.status === "skipped" ? "↩" : "✗"}
                  </span>
                  <span className="font-medium flex-1">{r.name}</span>
                  <span className="text-foreground/50">
                    {r.stopsInserted != null ? `${r.stopsInserted} stops` : r.reason ?? ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CSV Import */}
      <div className="card-pop bg-white p-6 space-y-3">
        <h3 className="font-black text-lg" style={{ fontFamily: "Bungee, sans-serif" }}>CSV BULK IMPORT</h3>
        <p className="text-sm text-foreground/70">
          Import multiple routes at once from a CSV file. Upload your file from the CSV Import tab — expected columns: <code className="bg-foreground/5 px-1 rounded text-xs">name, area, vibe, pace, color, description, startMartaName, startParkingName, workflowStatus, isFeatured, sponsorName, sponsorTier</code>
        </p>
        <div className="text-xs text-foreground/50 flex items-center gap-1.5">
          <FileText className="w-4 h-4" /> Use the Routes CSV tab to upload and map columns.
        </div>
      </div>
    </div>
  );
}

// ── CSV Import Tab ────────────────────────────────────────────────────────────

type FieldKey = "name" | "area" | "vibe" | "pace" | "color" | "description" |
  "startMartaName" | "startParkingName" | "workflowStatus" | "isFeatured" |
  "sponsorName" | "sponsorTier" | "durationMinutes" | "distanceMiles" |
  "ageGuidance" | "timeOfDayGuidance" | "adminNotes";

const ROUTE_FIELDS: { key: FieldKey; label: string; required?: boolean }[] = [
  { key: "name", label: "Name", required: true },
  { key: "area", label: "Area / Neighborhood" },
  { key: "vibe", label: "Vibe / Tagline" },
  { key: "pace", label: "Pace (Walkable / Bike Friendly)" },
  { key: "color", label: "Color (yellow/red/lime/sky/orange/navy)" },
  { key: "description", label: "Full Description" },
  { key: "startMartaName", label: "MARTA Start Name" },
  { key: "startParkingName", label: "Parking Start Name" },
  { key: "durationMinutes", label: "Duration (minutes)" },
  { key: "distanceMiles", label: "Distance (e.g. 3.5 mi)" },
  { key: "ageGuidance", label: "Age Guidance" },
  { key: "timeOfDayGuidance", label: "Time of Day Guidance" },
  { key: "workflowStatus", label: "Status (draft / published)" },
  { key: "isFeatured", label: "Featured (true/false)" },
  { key: "sponsorName", label: "Sponsor Name" },
  { key: "sponsorTier", label: "Sponsor Tier" },
  { key: "adminNotes", label: "Admin Notes" },
];

const ALIASES: Record<string, FieldKey> = {
  "route name": "name", title: "name", "route title": "name",
  neighborhood: "area", location: "area",
  tagline: "vibe", "short description": "vibe",
  "full description": "description", details: "description",
  "marta start": "startMartaName", transit: "startMartaName",
  parking: "startParkingName", "parking start": "startParkingName",
  duration: "durationMinutes", minutes: "durationMinutes",
  distance: "distanceMiles", miles: "distanceMiles",
  featured: "isFeatured",
  status: "workflowStatus",
  sponsor: "sponsorName",
  tier: "sponsorTier",
  notes: "adminNotes",
};

function autoMap(header: string): FieldKey | "" {
  const h = header.toLowerCase().trim();
  const direct = ROUTE_FIELDS.find((f) => f.key.toLowerCase() === h);
  if (direct) return direct.key;
  return ALIASES[h] ?? "";
}

function CsvImportTab({ adminKey }: { adminKey: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing" | "done">("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, FieldKey | "">>({});
  const [importResult, setImportResult] = useState<{
    inserted: number; duplicates: number; errors: number;
    rows: Array<{ rowIndex: number; name: string; status: string; error?: string }>;
  } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) return;
      const parse = (line: string) => {
        const result: string[] = [];
        let inQ = false, cur = "";
        for (const ch of line) {
          if (ch === '"') { inQ = !inQ; }
          else if (ch === "," && !inQ) { result.push(cur); cur = ""; }
          else cur += ch;
        }
        result.push(cur);
        return result;
      };
      const hdrs = parse(lines[0]!);
      const rows = lines.slice(1).map(parse);
      setHeaders(hdrs);
      setRawRows(rows);
      const initMap: Record<string, FieldKey | ""> = {};
      hdrs.forEach((h) => { initMap[h] = autoMap(h); });
      setColumnMap(initMap);
      setStep("mapping");
    };
    reader.readAsText(file);
  };

  const doImport = async () => {
    setStep("importing");
    const routes = rawRows.map((cols) => {
      const mapped: Record<string, string> = {};
      headers.forEach((h, i) => {
        const k = columnMap[h];
        if (k) mapped[k] = cols[i] ?? "";
      });
      return mapped;
    }).filter((r) => r.name);

    const res = await fetch(`${API_BASE}/admin/routes/bulk-import`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ routes }),
    });
    const result = await res.json() as typeof importResult;
    setImportResult(result);
    setStep("done");
  };

  const reset = () => {
    setStep("upload"); setHeaders([]); setRawRows([]); setColumnMap({}); setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  if (step === "done" && importResult) {
    return (
      <div className="card-pop bg-white p-6 space-y-4">
        <h3 className="font-black text-lg" style={{ fontFamily: "Bungee, sans-serif" }}>IMPORT COMPLETE</h3>
        <div className="flex flex-wrap gap-4">
          <div className="text-center px-6 py-4 bg-green-50 rounded-xl border-2 border-green-200">
            <div className="text-3xl font-black text-green-700">{importResult.inserted}</div>
            <div className="text-xs font-bold text-green-600 uppercase">Inserted</div>
          </div>
          <div className="text-center px-6 py-4 bg-purple-50 rounded-xl border-2 border-purple-200">
            <div className="text-3xl font-black text-purple-700">{importResult.duplicates}</div>
            <div className="text-xs font-bold text-purple-600 uppercase">Duplicates</div>
          </div>
          <div className="text-center px-6 py-4 bg-red-50 rounded-xl border-2 border-red-200">
            <div className="text-3xl font-black text-red-700">{importResult.errors}</div>
            <div className="text-xs font-bold text-red-600 uppercase">Errors</div>
          </div>
        </div>
        <button type="button" onClick={reset} className="button-pop bg-white px-5 py-2.5 font-display text-xs tracking-widest uppercase">
          Import Another File
        </button>
      </div>
    );
  }

  if (step === "importing") {
    return (
      <div className="card-pop bg-white p-10 text-center space-y-4">
        <Loader2 className="w-12 h-12 mx-auto animate-spin text-brand-red" />
        <p className="font-black text-lg" style={{ fontFamily: "Bungee, sans-serif" }}>IMPORTING…</p>
      </div>
    );
  }

  if (step === "mapping") {
    return (
      <div className="card-pop bg-white p-4 space-y-4">
        <h3 className="font-black text-sm uppercase" style={{ fontFamily: "Bungee, sans-serif" }}>
          Map Columns ({headers.length} detected, {rawRows.length} rows)
        </h3>
        <div className="grid gap-2">
          {headers.map((h) => (
            <div key={h} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-xs font-mono bg-foreground/5 px-2 py-1 rounded truncate">{h}</span>
              <span className="text-foreground/30 text-xs">→</span>
              <select
                value={columnMap[h] ?? ""}
                onChange={(e) => setColumnMap((prev) => ({ ...prev, [h]: e.target.value as FieldKey | "" }))}
                className="flex-1 border-2 border-foreground rounded-lg px-2 py-1 text-xs bg-white"
              >
                <option value="">— Skip —</option>
                {ROUTE_FIELDS.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}{f.required ? " *" : ""}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={reset} className="button-pop bg-white text-xs px-3 py-2 font-bold uppercase">← Upload Different File</button>
          <button type="button" onClick={doImport} className="button-pop bg-brand-navy text-white text-xs px-4 py-2 font-bold uppercase">
            Import {rawRows.length} Rows →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card-pop bg-white p-6 space-y-4">
        <h3 className="font-black text-lg" style={{ fontFamily: "Bungee, sans-serif" }}>ROUTES CSV IMPORT</h3>
        <p className="text-sm text-foreground/70">
          Upload a CSV to bulk-import routes. Required column: <strong>name</strong>. All other columns are optional.
        </p>
        <label className="flex flex-col items-center gap-4 border-4 border-dashed border-foreground/30 rounded-2xl p-8 cursor-pointer hover:border-brand-red hover:bg-brand-cream/40 transition-colors">
          <Upload className="w-10 h-10 text-foreground/40" />
          <div className="text-center">
            <div className="font-black text-base">Upload CSV File</div>
            <div className="text-sm text-foreground/60">Click to browse or drag and drop</div>
          </div>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={handleFile} />
        </label>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function AdminRoutes() {
  const [unlocked, setUnlocked] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState("");
  const [activeTab, setActiveTab] = useState<"routes" | "migration" | "csv-import">("routes");

  useEffect(() => {
    if (sessionStorage.getItem(UNLOCK_KEY) === "1") {
      setUnlocked(true);
      setAdminKey(sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? ADMIN_PASSWORD);
    }
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError("");
    const res = await fetch(`${API_BASE}/admin/routes`, {
      headers: { "x-admin-key": keyInput },
    });
    if (res.status === 401) { setKeyError("Incorrect admin key."); return; }
    sessionStorage.setItem(UNLOCK_KEY, "1");
    sessionStorage.setItem(ADMIN_KEY_STORAGE, keyInput);
    setAdminKey(keyInput);
    setUnlocked(true);
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[hsl(var(--brand-cream))] flex items-center justify-center p-4">
        <div className="max-w-sm w-full card-pop bg-white p-8 space-y-6">
          <div className="text-center">
            <div className="text-3xl font-black mb-1" style={{ fontFamily: "Bungee, sans-serif" }}>ADMIN</div>
            <div className="text-sm text-foreground/60">Routes Hub</div>
          </div>
          <form onSubmit={handleUnlock} className="space-y-3">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Admin password"
              className="w-full border-2 border-foreground rounded-xl px-4 py-2.5 text-sm"
              autoFocus
            />
            {keyError && <p className="text-red-600 text-xs font-bold">{keyError}</p>}
            <button type="submit" className="button-pop w-full bg-brand-navy text-white py-2.5 font-display text-sm tracking-widest uppercase">
              Unlock →
            </button>
          </form>
        </div>
      </div>
    );
  }

  const TABS = [
    { key: "routes" as const, label: "All Routes", icon: <Route className="w-4 h-4" /> },
    { key: "migration" as const, label: "Migration", icon: <RefreshCw className="w-4 h-4" /> },
    { key: "csv-import" as const, label: "CSV Import", icon: <Upload className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--brand-cream))] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <AdminNav />

        <div className="border-2 border-foreground rounded-2xl bg-white shadow-pop overflow-hidden">
          <div className="p-4 border-b-2 border-foreground bg-[hsl(var(--brand-navy))] text-[hsl(var(--brand-cream))] flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black tracking-tight" style={{ fontFamily: "Bungee, sans-serif" }}>
                ROUTES HUB
              </h1>
              <p className="text-xs opacity-70">Create · Edit · Publish · Migrate</p>
            </div>
            <div className="flex gap-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors",
                    activeTab === t.key
                      ? "bg-brand-yellow text-foreground"
                      : "bg-white/10 text-brand-cream/80 hover:bg-white/20",
                  )}
                >
                  {t.icon}
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 md:p-6">
            {activeTab === "routes" && <RoutesTab adminKey={adminKey} />}
            {activeTab === "migration" && <MigrationTab adminKey={adminKey} />}
            {activeTab === "csv-import" && <CsvImportTab adminKey={adminKey} />}
          </div>
        </div>
      </div>
    </div>
  );
}
