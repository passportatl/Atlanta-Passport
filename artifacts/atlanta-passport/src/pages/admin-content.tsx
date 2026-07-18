import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2, Search, CheckCircle, XCircle, AlertTriangle, Eye, Archive,
  RefreshCw, ChevronDown, ChevronUp, Upload, FileText, CheckSquare, Square,
  X, MapPin, Globe, Phone, Tag, Star, Zap, Crown, Inbox, Newspaper,
  BookOpen, Route, Check, Download,
} from "lucide-react";
import AdminNav from "@/components/AdminNav";
import { cn } from "@/lib/utils";

const API_BASE = "/api";
const ADMIN_KEY_STORAGE = "atl-passport-admin-key";
const UNLOCK_KEY = "atlanta-passport-admin-unlocked";
const ADMIN_PASSWORD = "atlanta2026";

// ── Types ─────────────────────────────────────────────────────────────────────

type LocationSubmission = {
  id: string;
  name: string;
  primaryCategory: string;
  tags: string[] | null;
  address: string;
  neighborhood: string;
  website: string | null;
  reviewsLink: string | null;
  phone: string | null;
  hours: string | null;
  ageRestriction: string | null;
  priceRange: string | null;
  martaAccess: boolean | null;
  martaDetails: string | null;
  parkingNotes: string | null;
  accessibility: string | null;
  description: string | null;
  featuredItems: string | null;
  eventCalendar: string | null;
  heroImage: string | null;
  galleryImages: string[] | null;
  passportSummary: string | null;
  insiderTips: string | null;
  isStampStop: boolean | null;
  isFeaturedInterest: boolean | null;
  isSponsoredInterest: boolean | null;
  listingTier: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  notes: string | null;
  workflowStatus: string;
  assignedTo: string | null;
  completenessScore: number | null;
  adminNotes: string | null;
  isDuplicate: boolean | null;
  duplicateOfId: string | null;
  importSource: string | null;
  createdAt: string;
  reviewedAt: string | null;
  publishedAt: string | null;
  promotedBusinessId: string | null;
  promotedAt: string | null;
};

type BulkRowResult = {
  rowIndex: number;
  status: "inserted" | "duplicate" | "error";
  name: string;
  id?: string;
  duplicateOfId?: string;
  error?: string;
};

type BulkImportResult = {
  inserted: number;
  duplicates: number;
  errors: number;
  rows: BulkRowResult[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending:           { label: "Pending",          cls: "bg-brand-yellow text-foreground",  icon: <AlertTriangle className="w-3 h-3" /> },
  "under-review":    { label: "Under Review",     cls: "bg-blue-100 text-blue-800",        icon: <Eye className="w-3 h-3" /> },
  approved:          { label: "Approved",          cls: "bg-green-100 text-green-800",      icon: <CheckCircle className="w-3 h-3" /> },
  published:         { label: "Published",         cls: "bg-brand-green text-white",        icon: <CheckCircle className="w-3 h-3" /> },
  rejected:          { label: "Rejected",          cls: "bg-red-100 text-red-800",          icon: <XCircle className="w-3 h-3" /> },
  "changes-requested": { label: "Changes Needed", cls: "bg-orange-100 text-orange-800",    icon: <RefreshCw className="w-3 h-3" /> },
  duplicate:         { label: "Duplicate",         cls: "bg-purple-100 text-purple-800",    icon: <Copy className="w-3 h-3" /> },
  archived:          { label: "Archived",          cls: "bg-gray-100 text-gray-600",        icon: <Archive className="w-3 h-3" /> },
};

function Copy({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, cls: "bg-gray-100 text-gray-700", icon: null };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide", cfg.cls)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const cfg: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    free:     { label: "Free",     icon: <Star className="w-3 h-3" />,   cls: "bg-gray-100 text-gray-700" },
    featured: { label: "Featured", icon: <Zap className="w-3 h-3" />,    cls: "bg-brand-yellow text-foreground" },
    premier:  { label: "Premier",  icon: <Crown className="w-3 h-3" />,  cls: "bg-brand-navy text-white" },
  };
  const c = cfg[tier] ?? cfg.free!;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide", c.cls)}>
      {c.icon}
      {c.label}
    </span>
  );
}

function CompletenessBar({ score }: { score: number | null }) {
  const s = score ?? 0;
  const color = s >= 80 ? "bg-green-500" : s >= 50 ? "bg-brand-yellow" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${s}%` }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums">{s}%</span>
    </div>
  );
}

// ── CSV parser (RFC-4180) ──────────────────────────────────────────────────────

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  function parseLine(line: string) {
    const fields: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i]!;
      if (c === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (c === "," && !inQ) { fields.push(cur.trim()); cur = ""; }
      else cur += c;
    }
    fields.push(cur.trim());
    return fields;
  }
  return { headers: parseLine(lines[0]!), rows: lines.slice(1).map(parseLine) };
}

const LOCATION_FIELDS = [
  { key: "name",            label: "Location Name",    required: true },
  { key: "primaryCategory", label: "Primary Category", required: true },
  { key: "address",         label: "Address",          required: true },
  { key: "neighborhood",    label: "Neighborhood",     required: false },
  { key: "tags",            label: "Tags",             required: false },
  { key: "legacyCategories",label: "Legacy Categories",required: false },
  { key: "website",         label: "Website",          required: false },
  { key: "phone",           label: "Phone",            required: false },
  { key: "hours",           label: "Hours",            required: false },
  { key: "priceRange",      label: "Price Range",      required: false },
  { key: "ageRestriction",  label: "Age Restriction",  required: false },
  { key: "martaAccess",     label: "MARTA Access",     required: false },
  { key: "description",     label: "Description",      required: false },
  { key: "featuredItems",   label: "Featured Items",   required: false },
  { key: "heroImage",       label: "Hero Image URL",   required: false },
  { key: "passportSummary", label: "Passport Summary", required: false },
  { key: "insiderTips",     label: "Insider Tips",     required: false },
  { key: "isStampStop",     label: "Stamp Stop",       required: false },
  { key: "listingTier",     label: "Listing Tier",     required: false },
  { key: "contactName",     label: "Contact Name",     required: false },
  { key: "contactEmail",    label: "Contact Email",    required: false },
] as const;

type FieldKey = (typeof LOCATION_FIELDS)[number]["key"];

const ALIASES: Record<string, FieldKey> = {
  "name": "name", "location name": "name", "business name": "name", "title": "name",
  "primary category": "primaryCategory", "category": "primaryCategory", "type": "primaryCategory",
  "primary type": "primaryCategory",
  "address": "address", "street address": "address", "location": "address",
  "neighborhood": "neighborhood", "area": "neighborhood", "district": "neighborhood",
  "tags": "tags", "searchable tags": "tags", "keywords": "tags",
  "legacy categories": "legacyCategories", "old categories": "legacyCategories",
  "website": "website", "url": "website", "link": "website",
  "phone": "phone", "phone number": "phone", "contact phone": "phone",
  "hours": "hours", "business hours": "hours", "open hours": "hours",
  "price range": "priceRange", "price": "priceRange", "cost": "priceRange",
  "age restriction": "ageRestriction", "age": "ageRestriction",
  "marta access": "martaAccess", "marta": "martaAccess", "near marta": "martaAccess",
  "description": "description", "about": "description", "details": "description",
  "featured items": "featuredItems", "menu items": "featuredItems", "highlights": "featuredItems",
  "hero image": "heroImage", "hero image url": "heroImage", "image": "heroImage", "photo": "heroImage",
  "passport summary": "passportSummary", "passport": "passportSummary",
  "insider tips": "insiderTips", "tips": "insiderTips",
  "stamp stop": "isStampStop", "is stamp stop": "isStampStop",
  "listing tier": "listingTier", "tier": "listingTier", "package": "listingTier",
  "contact name": "contactName", "contact": "contactName",
  "contact email": "contactEmail", "email": "contactEmail",
};

function autoMap(headers: string[]): Record<string, FieldKey | ""> {
  const map: Record<string, FieldKey | ""> = {};
  for (const h of headers) map[h] = ALIASES[h.toLowerCase().trim()] ?? "";
  return map;
}

// ── Admin API calls ───────────────────────────────────────────────────────────

async function fetchLocations(adminKey: string, status?: string, search?: string): Promise<LocationSubmission[]> {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (search) params.set("search", search);
  const res = await fetch(`${API_BASE}/admin/location-submissions?${params}`, {
    headers: { "x-admin-key": adminKey },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<LocationSubmission[]>;
}

async function patchLocation(id: string, patch: Record<string, unknown>, adminKey: string): Promise<LocationSubmission> {
  const res = await fetch(`${API_BASE}/admin/location-submissions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<LocationSubmission>;
}

async function bulkImportLocations(locations: Record<string, string>[], adminKey: string): Promise<BulkImportResult> {
  const res = await fetch(`${API_BASE}/admin/location-submissions/bulk-import`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify({ locations }),
  });
  if (!res.ok) throw new Error(`Import failed: ${res.status}`);
  return res.json() as Promise<BulkImportResult>;
}

type PromoteResult = {
  total: number;
  promoted: number;
  reviewNeeded: number;
  skipped: number;
  results: Array<{
    id: string;
    name: string;
    status: "promoted" | "skipped" | "review-needed";
    businessId?: string;
    slug?: string;
    reason?: string;
    warnings?: string[];
  }>;
};

async function promoteLocation(id: string, adminKey: string): Promise<{ businessId: string; slug: string; status: string; warnings: string[] }> {
  const res = await fetch(`${API_BASE}/admin/location-submissions/${id}/promote`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `${res.status}`);
  }
  return res.json() as Promise<{ businessId: string; slug: string; status: string; warnings: string[] }>;
}

async function promoteBulk(adminKey: string): Promise<PromoteResult> {
  const res = await fetch(`${API_BASE}/admin/location-submissions/promote-bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`Promote failed: ${res.status}`);
  return res.json() as Promise<PromoteResult>;
}

async function syncSheet(type: "events" | "locations", adminKey: string): Promise<{ synced: number; url: string }> {
  const res = await fetch(`${API_BASE}/admin/sheets/sync-${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
  });
  if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
  return res.json() as Promise<{ synced: number; url: string }>;
}

// ── Location Card ─────────────────────────────────────────────────────────────

function LocationCard({
  loc,
  adminKey,
  selected,
  onSelect,
  onUpdated,
}: {
  loc: LocationSubmission;
  adminKey: string;
  selected: boolean;
  onSelect: () => void;
  onUpdated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [promoteMsg, setPromoteMsg] = useState("");
  const [editStatus, setEditStatus] = useState(loc.workflowStatus);
  const [editNotes, setEditNotes] = useState(loc.adminNotes ?? "");
  const [editAssigned, setEditAssigned] = useState(loc.assignedTo ?? "");

  const doUpdate = async (patch: Record<string, unknown>) => {
    setSaving(true);
    try {
      await patchLocation(loc.id, patch, adminKey);
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const doPromote = async () => {
    if (!confirm(`Promote "${loc.name}" to the business directory? This will create a live business record.`)) return;
    setPromoting(true);
    setPromoteMsg("");
    try {
      const result = await promoteLocation(loc.id, adminKey);
      setPromoteMsg(
        result.warnings && result.warnings.length > 0
          ? `✓ Added to directory (slug: ${result.slug}). Warnings: ${result.warnings.join("; ")}`
          : `✓ Added to business directory (slug: ${result.slug})`,
      );
      onUpdated();
    } catch (err) {
      setPromoteMsg(`✗ ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setPromoting(false);
    }
  };

  const quickAction = (status: string) => () => doUpdate({ workflowStatus: status });

  return (
    <div className={cn("card-pop bg-white transition-all", selected && "ring-2 ring-brand-yellow")}>
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        <button type="button" onClick={onSelect} className="mt-0.5 shrink-0">
          {selected
            ? <CheckSquare className="w-4 h-4 text-brand-yellow" />
            : <Square className="w-4 h-4 text-foreground/30" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-black text-sm truncate">{loc.name}</span>
            <StatusBadge status={loc.workflowStatus} />
            <TierBadge tier={loc.listingTier} />
            {loc.promotedBusinessId && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                ✓ In Directory
              </span>
            )}
            {loc.isDuplicate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                ⚠ Possible Duplicate
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-foreground/60">
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {loc.primaryCategory}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {loc.neighborhood}
            </span>
            {loc.website && (
              <a href={loc.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-brand-red underline">
                <Globe className="w-3 h-3" />
                Website
              </a>
            )}
            {loc.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {loc.phone}
              </span>
            )}
          </div>

          {loc.tags && loc.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {loc.tags.slice(0, 6).map((t) => (
                <span key={t} className="px-1.5 py-0.5 bg-foreground/8 rounded text-[10px] border border-foreground/15">
                  {t}
                </span>
              ))}
              {loc.tags.length > 6 && (
                <span className="text-[10px] text-foreground/50">+{loc.tags.length - 6} more</span>
              )}
            </div>
          )}

          <div className="mt-2">
            <CompletenessBar score={loc.completenessScore} />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-foreground/5 text-foreground/50"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5 border-t border-foreground/10 pt-3">
        {[
          { status: "under-review",      label: "Mark Under Review",   cls: "bg-blue-50 text-blue-800" },
          { status: "approved",          label: "Approve",             cls: "bg-green-50 text-green-800" },
          { status: "published",         label: "Publish",             cls: "bg-brand-green text-white" },
          { status: "changes-requested", label: "Request Changes",     cls: "bg-orange-50 text-orange-800" },
          { status: "rejected",          label: "Reject",              cls: "bg-red-50 text-red-800" },
          { status: "duplicate",         label: "Flag Duplicate",      cls: "bg-purple-50 text-purple-800" },
          { status: "archived",          label: "Archive",             cls: "bg-gray-50 text-gray-700" },
        ]
          .filter((a) => a.status !== loc.workflowStatus)
          .map((a) => (
            <button
              key={a.status}
              type="button"
              disabled={saving}
              onClick={quickAction(a.status)}
              className={cn("button-pop text-[10px] px-2.5 py-1.5 font-bold uppercase tracking-wide disabled:opacity-50", a.cls)}
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : a.label}
            </button>
          ))}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="button-pop text-[10px] px-2.5 py-1.5 font-bold uppercase tracking-wide bg-white text-foreground/70 ml-auto"
        >
          {expanded ? "Hide Details" : "View / Edit"}
        </button>
      </div>

      {/* Expanded detail + edit */}
      {expanded && (
        <div className="border-t-2 border-foreground/10 p-4 space-y-4 bg-[hsl(var(--brand-cream)/0.5)]">
          {/* Content sections */}
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="font-bold text-[10px] uppercase tracking-wide text-foreground/50">Business Info</div>
              {loc.description && <p className="text-xs text-foreground/75 line-clamp-4">{loc.description}</p>}
              {loc.featuredItems && <p className="text-xs"><span className="font-bold">Featured Items:</span> {loc.featuredItems}</p>}
              {loc.hours && <p className="text-xs whitespace-pre-line"><span className="font-bold">Hours:</span> {loc.hours}</p>}
              {loc.priceRange && <p className="text-xs"><span className="font-bold">Price:</span> {loc.priceRange}</p>}
              {loc.ageRestriction && <p className="text-xs"><span className="font-bold">Age:</span> {loc.ageRestriction}</p>}
              {loc.martaAccess && <p className="text-xs">🚇 MARTA accessible {loc.martaDetails ? `— ${loc.martaDetails}` : ""}</p>}
              {loc.parkingNotes && <p className="text-xs"><span className="font-bold">Parking:</span> {loc.parkingNotes}</p>}
            </div>
            <div className="space-y-1">
              <div className="font-bold text-[10px] uppercase tracking-wide text-foreground/50">Passport</div>
              {loc.passportSummary && <p className="text-xs">{loc.passportSummary}</p>}
              {loc.insiderTips && <p className="text-xs"><span className="font-bold">Tips:</span> {loc.insiderTips}</p>}
              <div className="flex flex-wrap gap-2 mt-1">
                {loc.isStampStop && <span className="text-[10px] bg-brand-yellow px-2 py-0.5 rounded-full font-bold">🏷 Stamp Stop</span>}
                {loc.isFeaturedInterest && <span className="text-[10px] bg-blue-100 px-2 py-0.5 rounded-full font-bold">⭐ Featured Interest</span>}
                {loc.isSponsoredInterest && <span className="text-[10px] bg-purple-100 px-2 py-0.5 rounded-full font-bold">💼 Sponsored Interest</span>}
              </div>
              <div className="font-bold text-[10px] uppercase tracking-wide text-foreground/50 mt-2">Contact</div>
              <p className="text-xs">{loc.contactName} · {loc.contactEmail}</p>
              {loc.contactPhone && <p className="text-xs">{loc.contactPhone}</p>}
              {loc.notes && <p className="text-xs text-foreground/60 italic">{loc.notes}</p>}
              <div className="text-[10px] text-foreground/40 mt-1">
                Submitted {new Date(loc.createdAt).toLocaleDateString()}
                {loc.importSource && ` · via ${loc.importSource}`}
              </div>
            </div>
          </div>

          {/* Edit controls */}
          <div className="border-t border-foreground/10 pt-4 space-y-3">
            <div className="font-bold text-[10px] uppercase tracking-wide text-foreground/50">Admin Controls</div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full border-2 border-foreground rounded-lg px-2 py-1.5 text-xs bg-white"
                >
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Assigned To</label>
                <input
                  value={editAssigned}
                  onChange={(e) => setEditAssigned(e.target.value)}
                  placeholder="Staff name or email"
                  className="w-full border-2 border-foreground rounded-lg px-2 py-1.5 text-xs bg-white"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs font-bold block mb-1">Admin Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  placeholder="Internal notes…"
                  className="w-full border-2 border-foreground rounded-lg px-2 py-1.5 text-xs bg-white resize-none"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => doUpdate({ workflowStatus: editStatus, adminNotes: editNotes, assignedTo: editAssigned || null })}
                className="button-pop bg-brand-navy text-white text-xs px-4 py-2 font-bold uppercase tracking-wide disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => doUpdate({ isDuplicate: !loc.isDuplicate })}
                className="button-pop bg-purple-50 text-purple-800 text-xs px-4 py-2 font-bold uppercase tracking-wide"
              >
                {loc.isDuplicate ? "Clear Duplicate Flag" : "Flag as Duplicate"}
              </button>
              {!loc.promotedBusinessId ? (
                <button
                  type="button"
                  disabled={promoting}
                  onClick={doPromote}
                  className="button-pop bg-brand-green text-white text-xs px-4 py-2 font-bold uppercase tracking-wide disabled:opacity-50 inline-flex items-center gap-1.5 ml-auto"
                >
                  {promoting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                  Promote to Directory
                </button>
              ) : (
                <span className="ml-auto text-xs text-green-700 font-bold flex items-center gap-1 px-3 py-2">
                  <CheckCircle className="w-3.5 h-3.5" /> In Business Directory
                </span>
              )}
            </div>
            {promoteMsg && (
              <div className={cn("text-xs font-medium px-3 py-2 rounded-lg", promoteMsg.startsWith("✓") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
                {promoteMsg}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Locations Admin Tab ────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: "all",              label: "All" },
  { key: "pending",          label: "Pending" },
  { key: "under-review",     label: "Under Review" },
  { key: "approved",         label: "Approved" },
  { key: "published",        label: "Published" },
  { key: "changes-requested",label: "Changes" },
  { key: "rejected",         label: "Rejected" },
  { key: "duplicate",        label: "Duplicate" },
  { key: "archived",         label: "Archived" },
];

const BULK_ACTIONS = [
  { status: "under-review",      label: "Mark Under Review",   cls: "bg-blue-50 text-blue-800" },
  { status: "approved",          label: "Approve All",         cls: "bg-green-50 text-green-800" },
  { status: "published",         label: "Publish All",         cls: "bg-brand-green text-white" },
  { status: "rejected",          label: "Reject All",          cls: "bg-red-50 text-red-800" },
  { status: "archived",          label: "Archive All",         cls: "bg-gray-50 text-gray-700" },
];

function LocationsTab({ adminKey }: { adminKey: string }) {
  const [locations, setLocations] = useState<LocationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = useState(false);
  const [bulkMsg, setBulkMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLocations(adminKey, statusFilter, search);
      setLocations(data);
    } catch {
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [adminKey, statusFilter, search]);

  useEffect(() => { void load(); }, [load]);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allVisibleSelected = locations.length > 0 && locations.every((l) => selectedIds.has(l.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(locations.map((l) => l.id)));
  };

  const doBulkAction = async (status: string) => {
    if (selectedIds.size === 0) return;
    setBulkPending(true);
    setBulkMsg("");
    let count = 0;
    for (const id of selectedIds) {
      try {
        await patchLocation(id, { workflowStatus: status }, adminKey);
        count++;
      } catch { /* skip */ }
    }
    setBulkMsg(`Updated ${count} of ${selectedIds.size} locations.`);
    setSelectedIds(new Set());
    setBulkPending(false);
    void load();
  };

  // Counts for status tabs
  const countsByStatus = locations.reduce<Record<string, number>>((acc, l) => {
    acc[l.workflowStatus] = (acc[l.workflowStatus] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Status tab pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setStatusFilter(t.key)}
            className={cn(
              "px-3 py-1.5 rounded-full font-display text-[10px] tracking-widest uppercase border-2 border-foreground transition-colors",
              statusFilter === t.key
                ? "bg-brand-navy text-white"
                : "bg-white text-foreground/70 hover:bg-brand-cream",
            )}
          >
            {t.label}
            {t.key !== "all" && countsByStatus[t.key]
              ? ` (${countsByStatus[t.key]})`
              : ""}
          </button>
        ))}
      </div>

      {/* Search + select all */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, neighborhood, category, or email…"
            className="w-full border-2 border-foreground rounded-lg pl-9 pr-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-yellow"
          />
        </div>
        {locations.length > 0 && (
          <button
            type="button"
            onClick={toggleSelectAll}
            className="button-pop text-sm px-3 py-2 bg-white text-foreground inline-flex items-center gap-1.5 shrink-0"
          >
            {allVisibleSelected ? <CheckSquare className="w-4 h-4 text-brand-yellow" /> : <Square className="w-4 h-4" />}
            {allVisibleSelected ? "Deselect all" : "Select all"}
          </button>
        )}
        <button
          type="button"
          onClick={load}
          className="button-pop text-sm p-2 bg-white text-foreground"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="card-pop bg-brand-cream border-2 border-foreground p-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-black">{selectedIds.size} selected</span>
          <div className="flex flex-wrap gap-1.5">
            {BULK_ACTIONS.map((a) => (
              <button
                key={a.status}
                type="button"
                disabled={bulkPending}
                onClick={() => doBulkAction(a.status)}
                className={cn("button-pop text-xs px-2.5 py-1.5 inline-flex items-center gap-1 disabled:opacity-50", a.cls)}
              >
                {bulkPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : a.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-foreground/40 hover:text-foreground ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
          {bulkMsg && (
            <div className="w-full text-xs font-bold pt-1 border-t border-foreground/20">{bulkMsg}</div>
          )}
        </div>
      )}

      {loading && <div className="card-pop bg-white p-8 text-center text-sm">Loading…</div>}

      {!loading && locations.length === 0 && (
        <div className="card-pop bg-white p-10 text-center">
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="font-black text-lg" style={{ fontFamily: "Bungee, sans-serif" }}>No locations</p>
          <p className="text-sm text-foreground/70 mt-1">
            {search ? "No locations match that search." : "No locations in this status category."}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {locations.map((loc) => (
          <LocationCard
            key={loc.id}
            loc={loc}
            adminKey={adminKey}
            selected={selectedIds.has(loc.id)}
            onSelect={() => toggleSelect(loc.id)}
            onUpdated={load}
          />
        ))}
      </div>
    </div>
  );
}

// ── CSV Import Tab ────────────────────────────────────────────────────────────

type CsvStep = "upload" | "mapping" | "preview" | "importing" | "done";

function CsvImportTab({ adminKey }: { adminKey: string }) {
  const [step, setStep] = useState<CsvStep>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, FieldKey | "">>({});
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers: h, rows: r } = parseCsv(text);
      setHeaders(h);
      setRawRows(r);
      setColumnMap(autoMap(h));
      setStep("mapping");
    };
    reader.readAsText(file);
  };

  const buildPreviewRows = () => {
    return rawRows.slice(0, 5).map((cols) => {
      const mapped: Record<string, string> = {};
      headers.forEach((h, i) => {
        const key = columnMap[h];
        if (key) mapped[key] = cols[i] ?? "";
      });
      const errors: string[] = [];
      if (!mapped.name) errors.push("Missing name");
      if (!mapped.primaryCategory) errors.push("Missing primary category");
      if (!mapped.address) errors.push("Missing address");
      return { mapped, errors };
    });
  };

  const doImport = async () => {
    setImporting(true);
    setStep("importing");
    const locations = rawRows.map((cols) => {
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        const key = columnMap[h];
        if (key) row[key] = cols[i] ?? "";
      });
      return row;
    });
    try {
      const result = await bulkImportLocations(locations, adminKey);
      setImportResult(result);
      setStep("done");
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
      setStep("preview");
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setStep("upload");
    setHeaders([]);
    setRawRows([]);
    setColumnMap({});
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  if (step === "done" && importResult) {
    return (
      <div className="space-y-4">
        <div className="card-pop bg-white p-6 space-y-4">
          <h3 className="font-black text-lg" style={{ fontFamily: "Bungee, sans-serif" }}>
            IMPORT COMPLETE
          </h3>
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

          {importResult.rows.filter((r) => r.status !== "inserted").length > 0 && (
            <div className="space-y-2">
              <div className="font-bold text-sm">Rows needing attention:</div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {importResult.rows
                  .filter((r) => r.status !== "inserted")
                  .map((r) => (
                    <div
                      key={r.rowIndex}
                      className={cn(
                        "flex items-start gap-3 px-3 py-2 rounded-lg text-xs",
                        r.status === "duplicate" ? "bg-purple-50" : "bg-red-50",
                      )}
                    >
                      <span className="font-bold">Row {r.rowIndex + 2}</span>
                      <span className="font-medium">{r.name}</span>
                      <span className="text-foreground/60 ml-auto">
                        {r.status === "duplicate" ? `Duplicate of ${r.duplicateOfId?.slice(0, 8)}…` : r.error}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={reset}
              className="button-pop bg-white px-5 py-2.5 font-display text-xs tracking-widest uppercase"
            >
              Import Another File
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "importing") {
    return (
      <div className="card-pop bg-white p-10 text-center space-y-4">
        <Loader2 className="w-12 h-12 mx-auto animate-spin text-brand-red" />
        <p className="font-black text-lg" style={{ fontFamily: "Bungee, sans-serif" }}>
          IMPORTING {rawRows.length} LOCATIONS…
        </p>
        <p className="text-sm text-foreground/60">This may take a moment. Please don't close this tab.</p>
      </div>
    );
  }

  if (step === "preview") {
    const preview = buildPreviewRows();
    const errorCount = rawRows.filter((cols) => {
      const mapped: Record<string, string> = {};
      headers.forEach((h, i) => { const k = columnMap[h]; if (k) mapped[k] = cols[i] ?? ""; });
      return !mapped.name || !mapped.primaryCategory || !mapped.address;
    }).length;

    return (
      <div className="space-y-4">
        <div className="card-pop bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-sm uppercase" style={{ fontFamily: "Bungee, sans-serif" }}>
              Preview ({rawRows.length} rows)
            </h3>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep("mapping")} className="button-pop bg-white text-xs px-3 py-2 font-bold uppercase">
                ← Back to Mapping
              </button>
              <button
                type="button"
                onClick={doImport}
                disabled={errorCount === rawRows.length}
                className="button-pop bg-brand-red text-white text-xs px-4 py-2 font-bold uppercase disabled:opacity-50"
              >
                Import {rawRows.length - errorCount} Valid Rows
              </button>
            </div>
          </div>

          {errorCount > 0 && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg border border-orange-200 text-xs font-medium text-orange-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {errorCount} row{errorCount !== 1 ? "s" : ""} have missing required fields and will be skipped.
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-brand-cream">
                  <th className="border border-foreground/20 px-2 py-1.5 text-left font-bold">Name</th>
                  <th className="border border-foreground/20 px-2 py-1.5 text-left font-bold">Category</th>
                  <th className="border border-foreground/20 px-2 py-1.5 text-left font-bold">Address</th>
                  <th className="border border-foreground/20 px-2 py-1.5 text-left font-bold">Neighborhood</th>
                  <th className="border border-foreground/20 px-2 py-1.5 text-left font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className={row.errors.length > 0 ? "bg-red-50" : ""}>
                    <td className="border border-foreground/20 px-2 py-1.5">{row.mapped.name || "—"}</td>
                    <td className="border border-foreground/20 px-2 py-1.5">{row.mapped.primaryCategory || "—"}</td>
                    <td className="border border-foreground/20 px-2 py-1.5 max-w-[160px] truncate">{row.mapped.address || "—"}</td>
                    <td className="border border-foreground/20 px-2 py-1.5">{row.mapped.neighborhood || "—"}</td>
                    <td className="border border-foreground/20 px-2 py-1.5">
                      {row.errors.length > 0
                        ? <span className="text-red-600 font-bold">⚠ {row.errors.join(", ")}</span>
                        : <span className="text-green-600 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rawRows.length > 5 && (
            <p className="text-xs text-foreground/50 mt-2">Showing first 5 of {rawRows.length} rows.</p>
          )}
        </div>
      </div>
    );
  }

  if (step === "mapping") {
    return (
      <div className="space-y-4">
        <div className="card-pop bg-white p-4 space-y-4">
          <h3 className="font-black text-sm uppercase" style={{ fontFamily: "Bungee, sans-serif" }}>
            Map Columns ({headers.length} detected, {rawRows.length} rows)
          </h3>
          <div className="grid gap-2">
            {headers.map((h) => (
              <div key={h} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-xs font-mono bg-foreground/5 px-2 py-1 rounded truncate" title={h}>
                  {h}
                </span>
                <span className="text-foreground/30 text-xs">→</span>
                <select
                  value={columnMap[h] ?? ""}
                  onChange={(e) => setColumnMap((prev) => ({ ...prev, [h]: e.target.value as FieldKey | "" }))}
                  className="flex-1 border-2 border-foreground rounded-lg px-2 py-1 text-xs bg-white"
                >
                  <option value="">— Skip this column —</option>
                  {LOCATION_FIELDS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}{f.required ? " *" : ""}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={reset} className="button-pop bg-white text-xs px-3 py-2 font-bold uppercase">
              ← Upload Different File
            </button>
            <button
              type="button"
              onClick={() => setStep("preview")}
              className="button-pop bg-brand-navy text-white text-xs px-4 py-2 font-bold uppercase"
            >
              Preview Import →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card-pop bg-white p-6 space-y-4">
        <h3 className="font-black text-lg" style={{ fontFamily: "Bungee, sans-serif" }}>
          CSV BULK IMPORT
        </h3>
        <p className="text-sm text-foreground/70">
          Upload a CSV file with location data. After upload you'll map columns, preview the data, and then import. Legacy categories are automatically preserved as searchable tags.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="font-bold text-xs uppercase tracking-wide text-foreground/60">Required columns</div>
            <ul className="text-xs space-y-1 text-foreground/70">
              {LOCATION_FIELDS.filter((f) => f.required).map((f) => (
                <li key={f.key} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-red shrink-0" />
                  {f.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <div className="font-bold text-xs uppercase tracking-wide text-foreground/60">Optional columns</div>
            <ul className="text-xs space-y-1 text-foreground/70 columns-2">
              {LOCATION_FIELDS.filter((f) => !f.required).map((f) => (
                <li key={f.key} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 shrink-0" />
                  {f.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <label className="flex flex-col items-center gap-4 border-4 border-dashed border-foreground/30 rounded-2xl p-8 cursor-pointer hover:border-brand-red hover:bg-brand-cream/40 transition-colors">
          <Upload className="w-10 h-10 text-foreground/40" />
          <div className="text-center">
            <div className="font-black text-base">Upload CSV File</div>
            <div className="text-sm text-foreground/60">Click to browse or drag and drop</div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={handleFile}
          />
        </label>

        <div className="flex items-center gap-2 text-xs text-foreground/50">
          <FileText className="w-4 h-4 shrink-0" />
          <span>
            Supported: <strong>.csv</strong> · UTF-8 or Latin-1 encoded · RFC-4180 format
          </span>
        </div>
      </div>

      <div className="card-pop bg-white p-4">
        <div className="font-bold text-xs uppercase tracking-wide text-foreground/50 mb-2">Tips for best results</div>
        <ul className="text-xs space-y-1 text-foreground/70">
          <li>· Column headers don't need to match exactly — common aliases are recognized automatically.</li>
          <li>· Put multiple tags in one cell, comma-separated: <code className="bg-foreground/5 px-1 rounded">Live Music, Rooftop, Black-Owned</code></li>
          <li>· Legacy categories in a <code className="bg-foreground/5 px-1 rounded">legacyCategories</code> column are merged into tags automatically.</li>
          <li>· Duplicate detection is based on exact name match (case-insensitive). Duplicates are skipped and flagged.</li>
          <li>· MARTA Access: use <code className="bg-foreground/5 px-1 rounded">yes</code> / <code className="bg-foreground/5 px-1 rounded">no</code> · Stamp Stop: use <code className="bg-foreground/5 px-1 rounded">yes</code> / <code className="bg-foreground/5 px-1 rounded">no</code></li>
          <li>· Listing tier: <code className="bg-foreground/5 px-1 rounded">free</code> / <code className="bg-foreground/5 px-1 rounded">featured</code> / <code className="bg-foreground/5 px-1 rounded">premier</code> (defaults to free)</li>
        </ul>
      </div>
    </div>
  );
}

// ── Migration Utility Tab ─────────────────────────────────────────────────────

function MigrationTab({ adminKey }: { adminKey: string }) {
  const [promoting, setPromoting] = useState(false);
  const [promoteResult, setPromoteResult] = useState<PromoteResult | null>(null);
  const [sheetSyncing, setSheetSyncing] = useState<"events" | "locations" | null>(null);
  const [sheetResults, setSheetResults] = useState<Record<string, { synced: number; url: string } | string>>({});

  const doBulkPromote = async () => {
    if (!confirm("Promote all published location submissions to the business directory? Only unpromoted records will be affected.")) return;
    setPromoting(true);
    setPromoteResult(null);
    try {
      const result = await promoteBulk(adminKey);
      setPromoteResult(result);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setPromoting(false);
    }
  };

  const doSyncSheet = async (type: "events" | "locations") => {
    setSheetSyncing(type);
    try {
      const result = await syncSheet(type, adminKey);
      setSheetResults((prev) => ({ ...prev, [type]: result }));
    } catch (err) {
      setSheetResults((prev) => ({ ...prev, [type]: `Error: ${err instanceof Error ? err.message : String(err)}` }));
    } finally {
      setSheetSyncing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Location → Business Promotion */}
      <div className="card-pop bg-white p-6 space-y-4">
        <div>
          <h3 className="font-black text-lg" style={{ fontFamily: "Bungee, sans-serif" }}>
            LOCATION MIGRATION UTILITY
          </h3>
          <p className="text-sm text-foreground/70 mt-1">
            Promote published location submissions into the live business directory. Non-destructive — original submissions are kept intact with a reference to the created business record. Duplicate slugs are resolved automatically.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-brand-cream rounded-xl border-2 border-foreground/20 space-y-1">
            <div className="font-bold text-[10px] uppercase tracking-wide text-foreground/50">What gets promoted</div>
            <p className="text-xs text-foreground/70">Only submissions with <strong>workflowStatus = published</strong> that have not yet been promoted.</p>
          </div>
          <div className="p-4 bg-brand-cream rounded-xl border-2 border-foreground/20 space-y-1">
            <div className="font-bold text-[10px] uppercase tracking-wide text-foreground/50">What gets created</div>
            <p className="text-xs text-foreground/70">A <strong>business record</strong> with name, category, address, description, and image mapped from the submission.</p>
          </div>
          <div className="p-4 bg-brand-cream rounded-xl border-2 border-foreground/20 space-y-1">
            <div className="font-bold text-[10px] uppercase tracking-wide text-foreground/50">Review-needed cases</div>
            <p className="text-xs text-foreground/70">Submissions missing a description get a placeholder — these are flagged as <strong>review-needed</strong> in the report.</p>
          </div>
        </div>

        <button
          type="button"
          disabled={promoting}
          onClick={doBulkPromote}
          className="button-pop bg-brand-green text-white px-6 py-3 font-display text-sm tracking-widest uppercase inline-flex items-center gap-2 disabled:opacity-50"
        >
          {promoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          {promoting ? "Promoting…" : "Promote All Published Locations"}
        </button>

        {promoteResult && (
          <div className="space-y-4 border-t border-foreground/10 pt-4">
            <div className="flex flex-wrap gap-4">
              <div className="text-center px-6 py-4 bg-green-50 rounded-xl border-2 border-green-200">
                <div className="text-3xl font-black text-green-700">{promoteResult.promoted}</div>
                <div className="text-xs font-bold text-green-600 uppercase">Promoted</div>
              </div>
              <div className="text-center px-6 py-4 bg-brand-yellow/20 rounded-xl border-2 border-brand-yellow/40">
                <div className="text-3xl font-black text-amber-700">{promoteResult.reviewNeeded}</div>
                <div className="text-xs font-bold text-amber-600 uppercase">Review Needed</div>
              </div>
              <div className="text-center px-6 py-4 bg-red-50 rounded-xl border-2 border-red-200">
                <div className="text-3xl font-black text-red-700">{promoteResult.skipped}</div>
                <div className="text-xs font-bold text-red-600 uppercase">Skipped / Errors</div>
              </div>
              <div className="text-center px-6 py-4 bg-foreground/5 rounded-xl border-2 border-foreground/20">
                <div className="text-3xl font-black">{promoteResult.total}</div>
                <div className="text-xs font-bold text-foreground/50 uppercase">Total</div>
              </div>
            </div>

            {promoteResult.results.length > 0 && (
              <div className="max-h-72 overflow-y-auto space-y-1.5">
                {promoteResult.results.map((r) => (
                  <div
                    key={r.id}
                    className={cn(
                      "flex items-start gap-3 px-3 py-2 rounded-lg text-xs",
                      r.status === "promoted" ? "bg-green-50" :
                      r.status === "review-needed" ? "bg-yellow-50" : "bg-red-50",
                    )}
                  >
                    <span className={cn("font-bold shrink-0",
                      r.status === "promoted" ? "text-green-700" :
                      r.status === "review-needed" ? "text-amber-700" : "text-red-700"
                    )}>
                      {r.status === "promoted" ? "✓" : r.status === "review-needed" ? "⚠" : "✗"}
                    </span>
                    <span className="font-medium flex-1">{r.name}</span>
                    <span className="text-foreground/50 text-right">
                      {r.slug ? `/${r.slug}` : r.reason ?? ""}
                      {r.warnings && r.warnings.length > 0 ? ` · ${r.warnings[0]}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Google Sheets Sync */}
      <div className="card-pop bg-white p-6 space-y-4">
        <div>
          <h3 className="font-black text-lg" style={{ fontFamily: "Bungee, sans-serif" }}>
            GOOGLE SHEETS EXPORT
          </h3>
          <p className="text-sm text-foreground/70 mt-1">
            Export the events table or location submissions to a Google Sheet on the connected Drive account. Each sync is a full rewrite — the sheet is the source of truth from the database, making it safe to run anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {(["events", "locations"] as const).map((type) => {
            const result = sheetResults[type];
            const isSyncing = sheetSyncing === type;
            return (
              <div key={type} className="p-4 bg-brand-cream rounded-xl border-2 border-foreground/20 space-y-3">
                <div className="font-bold text-sm uppercase tracking-wide">
                  {type === "events" ? "Events Table" : "Location Submissions"}
                </div>
                <p className="text-xs text-foreground/60">
                  {type === "events"
                    ? "All events (all statuses) with completeness score, contact info, and workflow status."
                    : "All location submissions with promotion tracking, completeness, and contact info."}
                </p>
                <button
                  type="button"
                  disabled={sheetSyncing !== null}
                  onClick={() => doSyncSheet(type)}
                  className="button-pop bg-brand-navy text-white text-xs px-4 py-2 font-bold uppercase tracking-wide inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {isSyncing ? "Syncing…" : "Sync to Sheet"}
                </button>
                {result && typeof result === "object" && (
                  <div className="text-xs space-y-1">
                    <div className="text-green-700 font-bold">✓ Synced {result.synced} rows</div>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline break-all"
                    >
                      Open in Google Sheets →
                    </a>
                  </div>
                )}
                {result && typeof result === "string" && (
                  <div className="text-xs text-red-700 font-medium">{result}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function AdminContent() {
  const [unlocked, setUnlocked] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState("");
  const [contentTab, setContentTab] = useState<"locations" | "csv-import" | "migration" | "legends" | "experiences">("locations");

  useEffect(() => {
    if (sessionStorage.getItem(UNLOCK_KEY) === "1") {
      setUnlocked(true);
      setAdminKey(sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? ADMIN_PASSWORD);
    }
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError("");
    const res = await fetch(`${API_BASE}/admin/location-submissions?status=pending`, {
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
            <div className="text-sm text-foreground/60">Content Hub · Location Management</div>
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

  const CONTENT_TABS = [
    { key: "locations",   label: "Locations",   icon: <MapPin className="w-4 h-4" /> },
    { key: "csv-import",  label: "CSV Import",  icon: <Upload className="w-4 h-4" /> },
    { key: "migration",   label: "Migration",   icon: <RefreshCw className="w-4 h-4" /> },
    { key: "legends",     label: "ATL Legends", icon: <BookOpen className="w-4 h-4" /> },
    { key: "experiences", label: "Experiences", icon: <Route className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="min-h-screen bg-[hsl(var(--brand-cream))] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <AdminNav />

        {/* Page header */}
        <div className="border-2 border-foreground rounded-2xl bg-white shadow-pop overflow-hidden">
          <div className="p-4 border-b-2 border-foreground bg-[hsl(var(--brand-navy))] text-[hsl(var(--brand-cream))] flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black tracking-tight" style={{ fontFamily: "Bungee, sans-serif" }}>
                CONTENT HUB
              </h1>
              <p className="text-xs opacity-70">Locations · ATL Legends · Passport Experiences</p>
            </div>
            <div className="flex gap-1">
              {CONTENT_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setContentTab(t.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors",
                    contentTab === t.key
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
            {contentTab === "locations" && <LocationsTab adminKey={adminKey} />}
            {contentTab === "csv-import" && <CsvImportTab adminKey={adminKey} />}
            {contentTab === "migration" && <MigrationTab adminKey={adminKey} />}
            {contentTab === "legends" && (
              <div className="text-center py-16 space-y-3">
                <Newspaper className="w-12 h-12 mx-auto opacity-30" />
                <p className="font-black text-xl" style={{ fontFamily: "Bungee, sans-serif" }}>ATL LEGENDS</p>
                <p className="text-sm text-foreground/60 max-w-sm mx-auto">
                  Blog post management for stories about Atlanta's iconic people, places, and culture. Coming soon.
                </p>
              </div>
            )}
            {contentTab === "experiences" && (
              <div className="text-center py-16 space-y-3">
                <Route className="w-12 h-12 mx-auto opacity-30" />
                <p className="font-black text-xl" style={{ fontFamily: "Bungee, sans-serif" }}>PASSPORT EXPERIENCES</p>
                <p className="text-sm text-foreground/60 max-w-sm mx-auto">
                  Curated multi-stop itineraries tied to the Passport. Experience management coming soon.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
