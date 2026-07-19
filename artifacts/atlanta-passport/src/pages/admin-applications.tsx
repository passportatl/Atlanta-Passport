import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
import { useUser } from "@clerk/react";
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
  Upload,
  Download,
  FileText,
  CheckSquare,
  Square,
  Archive,
  X,
  Loader2,
  ArrowRight,
  Pencil,
  History,
  DollarSign,
  Save,
  RotateCcw,
  Image,
  Link,
  Tag,
  User,
  Zap,
  BarChart3,
} from "lucide-react";
import AdminNav from "@/components/AdminNav";
import { NotificationsBell, OpsDashboardPanel } from "@/components/admin/ops-dashboard";
import { EVENT_TYPES, AGE_OPTIONS } from "@/data/event-taxonomy";

// ── Typed helpers for the two new bulk endpoints ────────────────────────────

const API_BASE = "/api";

// ── Admin actor identity (for audit attribution) ────────────────────────────
// The signed-in Clerk user's name/email, kept in a module-level variable so
// plain fetch helpers can attach it without prop-drilling. URI-encoded because
// HTTP headers only allow Latin-1.
let currentAdminActor = "";

function adminActorHeader(): Record<string, string> {
  return currentAdminActor
    ? { "x-admin-actor": encodeURIComponent(currentAdminActor) }
    : {};
}

/** Tracks the signed-in Clerk user and returns "Name (email)" (or fallback). */
function useAdminActor(): string {
  const { user } = useUser();
  const actor = useMemo(() => {
    if (!user) return "";
    const name = user.fullName ?? user.username ?? "";
    const email = user.primaryEmailAddress?.emailAddress ?? "";
    if (name && email) return `${name} (${email})`;
    return name || email;
  }, [user]);
  useEffect(() => {
    currentAdminActor = actor;
  }, [actor]);
  return actor;
}

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

async function bulkImportEvents(
  events: Record<string, string>[],
  adminKey: string,
): Promise<BulkImportResult> {
  const res = await fetch(`${API_BASE}/admin/events/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify({ events }),
  });
  if (!res.ok) throw new Error(`Import failed: ${res.status}`);
  return res.json() as Promise<BulkImportResult>;
}

type PriorStatusEntry = { id: string; status: string };

async function bulkUpdateStatus(
  ids: string[],
  status: string,
  adminKey: string,
): Promise<{ updated: number; prior?: PriorStatusEntry[] }> {
  const res = await fetch(`${API_BASE}/admin/events/bulk-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey, ...adminActorHeader() },
    body: JSON.stringify({ ids, status }),
  });
  if (!res.ok) throw new Error(`Bulk update failed: ${res.status}`);
  return res.json() as Promise<{ updated: number; prior?: PriorStatusEntry[] }>;
}

async function bulkRestoreStatus(
  restore: PriorStatusEntry[],
  adminKey: string,
): Promise<{ updated: number }> {
  const res = await fetch(`${API_BASE}/admin/events/bulk-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify({ restore }),
  });
  if (!res.ok) throw new Error(`Undo failed: ${res.status}`);
  return res.json() as Promise<{ updated: number }>;
}

/** Bulk update in chunks so very large selections (1,500+) don't hit body-size
 *  or timeout limits. Reports progress after each chunk. */
const BULK_CHUNK_SIZE = 250;

async function bulkUpdateStatusChunked(
  ids: string[],
  status: string,
  adminKey: string,
  onProgress?: (done: number, total: number) => void,
): Promise<{ updated: number; prior: PriorStatusEntry[] }> {
  let updated = 0;
  const prior: PriorStatusEntry[] = [];
  for (let i = 0; i < ids.length; i += BULK_CHUNK_SIZE) {
    const chunk = ids.slice(i, i + BULK_CHUNK_SIZE);
    const result = await bulkUpdateStatus(chunk, status, adminKey);
    updated += result.updated;
    if (result.prior) prior.push(...result.prior);
    onProgress?.(Math.min(i + BULK_CHUNK_SIZE, ids.length), ids.length);
  }
  return { updated, prior };
}

async function bulkRestoreStatusChunked(
  entries: PriorStatusEntry[],
  adminKey: string,
  onProgress?: (done: number, total: number) => void,
): Promise<{ updated: number }> {
  let updated = 0;
  for (let i = 0; i < entries.length; i += BULK_CHUNK_SIZE) {
    const chunk = entries.slice(i, i + BULK_CHUNK_SIZE);
    const result = await bulkRestoreStatus(chunk, adminKey);
    updated += result.updated;
    onProgress?.(Math.min(i + BULK_CHUNK_SIZE, entries.length), entries.length);
  }
  return { updated };
}

// ── CSV utilities ────────────────────────────────────────────────────────────

/** RFC-4180-ish CSV parser — handles quoted fields and embedded commas. */
function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/);
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length === 0) return { headers: [], rows: [] };

  function parseLine(line: string): string[] {
    const fields: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i]!;
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === "," && !inQ) {
        fields.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    fields.push(cur.trim());
    return fields;
  }

  const headers = parseLine(nonEmpty[0]!);
  const rows = nonEmpty.slice(1).map(parseLine);
  return { headers, rows };
}

const KNOWN_FIELDS = [
  { key: "name",         label: "Event Name",   required: true  },
  { key: "category",     label: "Category",     required: true  },
  { key: "date",         label: "Date",         required: true  },
  { key: "venue",        label: "Venue",        required: true  },
  { key: "neighborhood", label: "Neighborhood", required: true  },
  { key: "time",         label: "Time",         required: false },
  { key: "address",      label: "Address",      required: false },
  { key: "cost",         label: "Cost / Price", required: false },
  { key: "url",          label: "Event URL",    required: false },
  { key: "description",  label: "Description",  required: false },
] as const;

type FieldKey = (typeof KNOWN_FIELDS)[number]["key"];

const ALIASES: Record<string, FieldKey> = {
  "event name": "name", "event": "name", "title": "name",
  "name": "name",
  "category": "category", "type": "category", "event type": "category",
  "date": "date", "event date": "date",
  "venue": "venue", "location": "venue", "place": "venue", "location name": "venue",
  "neighborhood": "neighborhood", "area": "neighborhood", "district": "neighborhood",
  "time": "time", "start time": "time", "event time": "time",
  "address": "address", "street address": "address",
  "cost": "cost", "price": "cost", "ticket price": "cost", "admission": "cost", "fee": "cost",
  "url": "url", "link": "url", "website": "url", "event url": "url", "tickets": "url",
  "description": "description", "details": "description", "about": "description",
};

function autoMap(headers: string[]): Record<string, FieldKey | ""> {
  const map: Record<string, FieldKey | ""> = {};
  for (const h of headers) {
    map[h] = ALIASES[h.toLowerCase().trim()] ?? "";
  }
  return map;
}

type ParsedRow = {
  raw: Record<string, string>;
  mapped: Record<FieldKey, string>;
  errors: string[];
  isDuplicate: boolean;
  duplicateOfId?: string;
};

function buildParsedRows(
  headers: string[],
  rows: string[][],
  columnMap: Record<string, FieldKey | "">,
  existingEvents: AdminEventRecord[],
): ParsedRow[] {
  const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");

  return rows.map((cols) => {
    const raw: Record<string, string> = {};
    headers.forEach((h, i) => { raw[h] = cols[i] ?? ""; });

    const mapped = {} as Record<FieldKey, string>;
    for (const [h, fk] of Object.entries(columnMap)) {
      if (fk) mapped[fk as FieldKey] = (raw[h] ?? "").trim();
    }
    // Fill any unmapped required fields as empty
    for (const f of KNOWN_FIELDS) {
      if (!(f.key in mapped)) (mapped as Record<string, string>)[f.key] = "";
    }

    const errors: string[] = [];
    for (const f of KNOWN_FIELDS) {
      if (f.required && !mapped[f.key]) errors.push(`${f.label} is required`);
    }

    const dupMatch = errors.length === 0
      ? existingEvents.find(
          (e) =>
            norm(e.name) === norm(mapped.name) &&
            (norm(e.date) === norm(mapped.date) || norm(e.venue) === norm(mapped.venue)),
        )
      : undefined;

    return {
      raw,
      mapped,
      errors,
      isDuplicate: !!dupMatch,
      duplicateOfId: dupMatch?.id,
    };
  });
}

const CSV_TEMPLATE_HEADERS =
  "name,category,date,time,venue,address,neighborhood,cost,url,description";
const CSV_TEMPLATE_EXAMPLE =
  `"Battle of the Bands","Concert","June 13, 2026","3pm – 9pm","Atlantucky Brewing","170 Northside Dr SW, Atlanta GA 30313","Castleberry Hill","Free","https://example.com","Live music and vendors."`;

function downloadTemplate() {
  const content = [CSV_TEMPLATE_HEADERS, CSV_TEMPLATE_EXAMPLE].join("\n");
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "passport-atl-events-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── CsvImporter component ────────────────────────────────────────────────────

type ImportStage = "upload" | "map" | "preview" | "importing" | "done";

function CsvImporter({
  adminKey,
  existingEvents,
  onDone,
  onClose,
}: {
  adminKey: string;
  existingEvents: AdminEventRecord[];
  onDone: () => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<ImportStage>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, FieldKey | "">>({});
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers: h, rows: r } = parseCsv(text);
      if (h.length === 0) { setImportError("Could not parse CSV — make sure the file has headers in the first row."); return; }
      setHeaders(h);
      setRawRows(r);
      setColumnMap(autoMap(h));
      setImportError(null);
      setStage("map");
    };
    reader.readAsText(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".csv") || f.type === "text/csv")) handleFile(f);
  };

  const goPreview = () => {
    const rows = buildParsedRows(headers, rawRows, columnMap, existingEvents);
    setParsedRows(rows);
    setStage("preview");
  };

  const doImport = async () => {
    const toImport = parsedRows.filter(
      (r) => r.errors.length === 0 && !(skipDuplicates && r.isDuplicate),
    );
    if (toImport.length === 0) {
      setImportError("No valid rows to import after applying filters.");
      return;
    }
    setStage("importing");
    setImportError(null);
    try {
      const result = await bulkImportEvents(
        toImport.map((r) => r.mapped as unknown as Record<string, string>),
        adminKey,
      );
      setImportResult(result);
      setStage("done");
      onDone();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed");
      setStage("preview");
    }
  };

  const validCount = parsedRows.filter((r) => r.errors.length === 0 && !r.isDuplicate).length;
  const dupCount = parsedRows.filter((r) => r.isDuplicate && r.errors.length === 0).length;
  const errCount = parsedRows.filter((r) => r.errors.length > 0).length;
  const willImport = parsedRows.filter(
    (r) => r.errors.length === 0 && !(skipDuplicates && r.isDuplicate),
  ).length;

  return (
    <div className="card-pop bg-white border-2 border-foreground p-5 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-base" style={{ fontFamily: "Bungee, sans-serif" }}>
          Import Events from CSV
        </h3>
        <button type="button" onClick={onClose} className="text-foreground/40 hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Stage: upload */}
      {stage === "upload" && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={downloadTemplate}
            className="button-pop text-sm px-3 py-2 bg-brand-cream text-foreground inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download CSV Template
          </button>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-foreground/40 rounded-xl p-10 text-center cursor-pointer hover:border-foreground transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-foreground/40" />
            <p className="font-bold text-sm">Drop your CSV here, or click to browse</p>
            <p className="text-xs text-foreground/50 mt-1">Only .csv files · UTF-8 encoding</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {importError && (
            <p className="text-sm text-brand-red font-bold">{importError}</p>
          )}

          <div className="bg-brand-cream border-2 border-foreground rounded-xl p-3 text-xs space-y-1">
            <div className="font-black uppercase tracking-widest text-[10px] mb-1">Required columns</div>
            {KNOWN_FIELDS.filter((f) => f.required).map((f) => (
              <div key={f.key} className="inline-flex items-center gap-1 mr-2">
                <span className="font-mono bg-white border border-foreground/30 px-1 rounded">{f.key}</span>
              </div>
            ))}
            <div className="font-black uppercase tracking-widest text-[10px] mt-2 mb-1">Optional columns</div>
            {KNOWN_FIELDS.filter((f) => !f.required).map((f) => (
              <div key={f.key} className="inline-flex items-center gap-1 mr-2">
                <span className="font-mono bg-white border border-foreground/30 px-1 rounded">{f.key}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage: map columns */}
      {stage === "map" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <FileText className="w-4 h-4" />
            {rawRows.length} data rows detected · {headers.length} columns
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-2 border-foreground rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-brand-cream">
                  <th className="text-left px-3 py-2 font-black text-xs uppercase tracking-widest border-b-2 border-foreground">
                    Your column header
                  </th>
                  <th className="text-left px-3 py-2 font-black text-xs uppercase tracking-widest border-b-2 border-foreground">
                    Maps to field
                  </th>
                  <th className="text-left px-3 py-2 font-black text-xs uppercase tracking-widest border-b-2 border-foreground">
                    Sample value
                  </th>
                </tr>
              </thead>
              <tbody>
                {headers.map((h) => (
                  <tr key={h} className="border-b border-foreground/10 last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">{h}</td>
                    <td className="px-3 py-2">
                      <select
                        value={columnMap[h] ?? ""}
                        onChange={(e) =>
                          setColumnMap((prev) => ({ ...prev, [h]: e.target.value as FieldKey | "" }))
                        }
                        className="border-2 border-foreground rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-yellow w-full"
                      >
                        <option value="">— skip —</option>
                        {KNOWN_FIELDS.map((f) => (
                          <option key={f.key} value={f.key}>
                            {f.label}{f.required ? " *" : ""}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-xs text-foreground/60 max-w-[180px] truncate">
                      {rawRows[0]?.[headers.indexOf(h)] ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStage("upload")}
              className="button-pop text-sm px-3 py-2 bg-brand-cream text-foreground"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={goPreview}
              className="button-pop button-pop-yellow text-sm px-4 py-2 inline-flex items-center gap-2"
            >
              Preview rows <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stage: preview */}
      {stage === "preview" && (
        <div className="space-y-4">
          {/* Summary counts */}
          <div className="flex flex-wrap gap-2">
            <span className="badge-sticker bg-brand-lime text-foreground text-[10px]">
              ✅ {validCount} valid
            </span>
            {dupCount > 0 && (
              <span className="badge-sticker bg-brand-yellow text-brand-yellow-foreground text-[10px]">
                ⚠️ {dupCount} likely duplicate
              </span>
            )}
            {errCount > 0 && (
              <span className="badge-sticker bg-brand-red text-white text-[10px]">
                ❌ {errCount} error
              </span>
            )}
          </div>

          {dupCount > 0 && (
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="w-4 h-4 accent-brand-yellow"
              />
              Skip likely duplicates (import only the {validCount} new, valid rows)
            </label>
          )}

          {importError && (
            <p className="text-sm text-brand-red font-bold">{importError}</p>
          )}

          {/* Row table */}
          <div className="overflow-x-auto max-h-96 border-2 border-foreground rounded-xl">
            <table className="w-full text-xs min-w-[600px]">
              <thead className="sticky top-0 bg-brand-cream z-10">
                <tr>
                  <th className="text-left px-3 py-2 font-black uppercase tracking-widest border-b-2 border-foreground">#</th>
                  <th className="text-left px-3 py-2 font-black uppercase tracking-widest border-b-2 border-foreground">Status</th>
                  <th className="text-left px-3 py-2 font-black uppercase tracking-widest border-b-2 border-foreground">Name</th>
                  <th className="text-left px-3 py-2 font-black uppercase tracking-widest border-b-2 border-foreground">Date</th>
                  <th className="text-left px-3 py-2 font-black uppercase tracking-widest border-b-2 border-foreground">Venue</th>
                  <th className="text-left px-3 py-2 font-black uppercase tracking-widest border-b-2 border-foreground">Issues</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, i) => {
                  const hasError = row.errors.length > 0;
                  const willSkip = skipDuplicates && row.isDuplicate && !hasError;
                  return (
                    <tr
                      key={i}
                      className={`border-b border-foreground/10 last:border-0 ${hasError ? "bg-red-50" : willSkip ? "bg-yellow-50" : "bg-white text-foreground"}`}
                    >
                      <td className="px-3 py-1.5 text-foreground/50">{i + 1}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        {hasError ? (
                          <span className="badge-sticker bg-brand-red text-white text-[9px]">❌ Error</span>
                        ) : row.isDuplicate ? (
                          <span className="badge-sticker bg-brand-yellow text-brand-yellow-foreground text-[9px]">⚠️ Duplicate</span>
                        ) : (
                          <span className="badge-sticker bg-brand-lime text-foreground text-[9px]">✅ Valid</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 font-medium max-w-[160px] truncate">{row.mapped.name || "—"}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap">{row.mapped.date || "—"}</td>
                      <td className="px-3 py-1.5 max-w-[140px] truncate">{row.mapped.venue || "—"}</td>
                      <td className="px-3 py-1.5 text-foreground/60">
                        {hasError ? row.errors.join(" · ") : row.isDuplicate ? "Matches existing event" : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            <button
              type="button"
              onClick={() => setStage("map")}
              className="button-pop text-sm px-3 py-2 bg-brand-cream text-foreground"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={doImport}
              disabled={willImport === 0}
              className="button-pop button-pop-yellow text-sm px-4 py-2 inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" /> Import {willImport} event{willImport !== 1 ? "s" : ""} as Pending
            </button>
            {willImport === 0 && (
              <span className="text-xs text-foreground/60">No rows to import</span>
            )}
          </div>
        </div>
      )}

      {/* Stage: importing */}
      {stage === "importing" && (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin mb-3 text-foreground/50" />
          <p className="font-bold">Importing events…</p>
        </div>
      )}

      {/* Stage: done */}
      {stage === "done" && importResult && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="badge-sticker bg-brand-lime text-foreground">
              ✅ {importResult.inserted} imported
            </span>
            {importResult.duplicates > 0 && (
              <span className="badge-sticker bg-brand-yellow text-brand-yellow-foreground">
                ⚠️ {importResult.duplicates} skipped (duplicate)
              </span>
            )}
            {importResult.errors > 0 && (
              <span className="badge-sticker bg-brand-red text-white">
                ❌ {importResult.errors} error
              </span>
            )}
          </div>
          <p className="text-sm text-foreground/70">
            Imported events are in the <strong>Pending</strong> tab — review and publish from there.
          </p>
          {importResult.rows.filter((r) => r.status === "error").length > 0 && (
            <div className="bg-red-50 border-2 border-foreground rounded-xl p-3 text-xs space-y-1">
              <div className="font-black uppercase tracking-widest text-[10px] mb-1">Row errors</div>
              {importResult.rows
                .filter((r) => r.status === "error")
                .map((r) => (
                  <div key={r.rowIndex}>
                    Row {r.rowIndex + 1} — {r.name}: {r.error}
                  </div>
                ))}
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="button-pop button-pop-yellow text-sm px-4 py-2"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

// ── Ingestion system: types & fetch helpers ──────────────────────────────────

type EventSourceRecord = {
  id: string;
  name: string;
  type: string;
  config: string;
  isActive: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string;
  lastSyncMessage: string | null;
  consecutiveFailures: number;
  syncFailureAlertAt: string | null;
  syncFailureAlertDismissedAt: string | null;
  createdAt: string;
};

// A source is considered "failing" once it has failed this many times in a row.
const FAILING_THRESHOLD = 2;

async function dismissSyncAlert(id: string, adminKey: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/sources/${id}/dismiss-alert`, {
    method: "POST",
    headers: { "x-admin-key": adminKey },
  });
  if (!res.ok) throw new Error(`Failed to dismiss alert: ${res.status}`);
}

function hasActiveSyncAlert(s: EventSourceRecord): boolean {
  if (!s.syncFailureAlertAt) return false;
  if (!s.syncFailureAlertDismissedAt) return true;
  return new Date(s.syncFailureAlertDismissedAt) < new Date(s.syncFailureAlertAt);
}

function SyncFailureBanner({ adminKey }: { adminKey: string }) {
  const [alerts, setAlerts] = useState<EventSourceRecord[]>([]);

  const load = useCallback(async () => {
    try {
      const sources = await listSources(adminKey);
      setAlerts(sources.filter(hasActiveSyncAlert));
    } catch {
      // banner is best-effort — never block the dashboard
    }
  }, [adminKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const dismiss = async (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    try {
      await dismissSyncAlert(id, adminKey);
    } catch {
      void load();
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="mb-4 rounded-lg border-2 border-red-500 bg-red-50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-red-600 text-lg" aria-hidden>⚠️</span>
        <h2 className="font-bold text-red-800">
          Background sync failed for {alerts.length === 1 ? "1 source" : `${alerts.length} sources`}
        </h2>
      </div>
      <ul className="space-y-2">
        {alerts.map((s) => (
          <li
            key={s.id}
            className="flex items-start justify-between gap-3 bg-white/70 rounded-md px-3 py-2"
          >
            <div className="min-w-0">
              <p className="font-semibold text-sm text-red-900 truncate">{s.name}</p>
              <p className="text-xs text-red-700 break-words">
                {s.lastSyncMessage ?? "Sync failed"}
              </p>
              {s.syncFailureAlertAt && (
                <p className="text-[11px] text-red-500 mt-0.5">
                  Failing since {new Date(s.syncFailureAlertAt).toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={() => void dismiss(s.id)}
              className="text-xs font-semibold text-red-700 border border-red-300 rounded px-2 py-1 hover:bg-red-100 shrink-0"
            >
              Dismiss
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-red-600 mt-2">
        Check the Sources panel below to test or re-sync. Dismissing hides this until the source recovers and fails again.
      </p>
    </div>
  );
}

type ImportRunRecord = {
  id: string;
  sourceId: string;
  sourceName?: string;
  status: string;
  found: number;
  inserted: number;
  duplicates: number;
  changed: number;
  errors: number;
  errorDetail: string | null;
  startedAt: string;
  finishedAt: string | null;
};

type ImportRunRowRecord = {
  id: string;
  runId: string;
  eventId: string | null;
  status: string;
  externalId: string | null;
  rawName: string | null;
  rawDate: string | null;
  rawVenue: string | null;
  duplicateOfId: string | null;
  errorMessage: string | null;
};

type DuplicatePair = {
  flagged: AdminEventRecord & { duplicateConfidence?: number | null };
  original: AdminEventRecord | null;
};

async function listSources(adminKey: string): Promise<EventSourceRecord[]> {
  const res = await fetch(`${API_BASE}/admin/sources`, { headers: { "x-admin-key": adminKey } });
  if (!res.ok) throw new Error(`Failed to load sources: ${res.status}`);
  return res.json() as Promise<EventSourceRecord[]>;
}

type TestResult = { ok: true; found: number; sample: Array<{ name: string; date: string; venue: string }> } | { ok: false; error: string };

async function testSource(adminKey: string, id: string): Promise<TestResult> {
  const res = await fetch(`${API_BASE}/admin/sources/${id}/test`, {
    method: "POST",
    headers: { "x-admin-key": adminKey },
  });
  if (!res.ok) {
    const body = await res.json() as { error?: string };
    return { ok: false, error: body.error ?? `HTTP ${res.status}` };
  }
  const data = await res.json() as { found: number; sample: Array<{ name: string; date: string; venue: string }> };
  return { ok: true, ...data };
}

type CredentialsInfo = {
  ticketmasterKeySet: boolean;
  connectors?: Record<string, { envVar: string; set: boolean }>;
};

async function fetchCredentials(adminKey: string): Promise<CredentialsInfo> {
  try {
    const res = await fetch(`${API_BASE}/admin/sources/credentials`, { headers: { "x-admin-key": adminKey } });
    if (!res.ok) return { ticketmasterKeySet: false };
    return res.json() as Promise<CredentialsInfo>;
  } catch {
    return { ticketmasterKeySet: false };
  }
}

async function upsertSource(
  method: "POST" | "PATCH",
  idOrEmpty: string,
  data: { name?: string; type?: string; config?: Record<string, unknown>; isActive?: boolean },
  adminKey: string,
): Promise<EventSourceRecord> {
  const url = idOrEmpty
    ? `${API_BASE}/admin/sources/${idOrEmpty}`
    : `${API_BASE}/admin/sources`;
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: res.statusText }))) as { error: string };
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<EventSourceRecord>;
}

async function removeSource(id: string, adminKey: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/sources/${id}`, {
    method: "DELETE",
    headers: { "x-admin-key": adminKey },
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}

async function triggerSync(id: string, adminKey: string): Promise<ImportRunRecord> {
  const res = await fetch(`${API_BASE}/admin/sources/${id}/sync`, {
    method: "POST",
    headers: { "x-admin-key": adminKey },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: res.statusText }))) as { error: string };
    throw new Error(body.error ?? `Sync failed: ${res.status}`);
  }
  return res.json() as Promise<ImportRunRecord>;
}

async function listImportRuns(adminKey: string, sourceId?: string): Promise<ImportRunRecord[]> {
  const url = sourceId
    ? `${API_BASE}/admin/import-runs?sourceId=${sourceId}`
    : `${API_BASE}/admin/import-runs`;
  const res = await fetch(url, { headers: { "x-admin-key": adminKey } });
  if (!res.ok) throw new Error(`Failed to load runs: ${res.status}`);
  return res.json() as Promise<ImportRunRecord[]>;
}

async function getRunRows(runId: string, adminKey: string): Promise<ImportRunRowRecord[]> {
  const res = await fetch(`${API_BASE}/admin/import-runs/${runId}/rows`, {
    headers: { "x-admin-key": adminKey },
  });
  if (!res.ok) throw new Error(`Failed to load rows: ${res.status}`);
  return res.json() as Promise<ImportRunRowRecord[]>;
}

async function listDuplicates(adminKey: string): Promise<DuplicatePair[]> {
  const res = await fetch(`${API_BASE}/admin/events/duplicates`, {
    headers: { "x-admin-key": adminKey },
  });
  if (!res.ok) throw new Error(`Failed to load duplicates: ${res.status}`);
  return res.json() as Promise<DuplicatePair[]>;
}

// ── Source type metadata ─────────────────────────────────────────────────────

const SOURCE_TYPE_LABELS: Record<string, string> = {
  ticketmaster: "Ticketmaster",
  google_sheets: "Google Sheets",
  ical: "iCal Feed",
  rss: "RSS Feed",
  json_api: "JSON API",
  csv_url: "CSV URL",
  eventbrite: "Eventbrite",
  meetup: "Meetup",
  bandsintown: "Bandsintown",
  seatgeek: "SeatGeek",
  manual: "Manual (CSV)",
};

const SOURCE_TYPE_COLORS: Record<string, string> = {
  ticketmaster: "bg-brand-sky text-foreground",
  google_sheets: "bg-brand-lime text-foreground",
  ical: "bg-brand-orange text-white",
  rss: "bg-brand-yellow text-foreground",
  json_api: "bg-brand-sky text-foreground",
  csv_url: "bg-brand-lime text-foreground",
  eventbrite: "bg-brand-orange text-white",
  meetup: "bg-brand-red text-white",
  bandsintown: "bg-brand-navy text-white",
  seatgeek: "bg-brand-yellow text-brand-yellow-foreground",
  manual: "bg-brand-cream text-foreground",
};

// Which env credential each premium connector needs (mirrors the API's
// /admin/sources/credentials response).
const CONNECTOR_ENV_VARS: Record<string, string> = {
  ticketmaster: "TICKETMASTER_API_KEY",
  eventbrite: "EVENTBRITE_API_TOKEN",
  meetup: "MEETUP_ACCESS_TOKEN",
  bandsintown: "BANDSINTOWN_APP_ID",
  seatgeek: "SEATGEEK_CLIENT_ID",
};

type ConfigField = { key: string; label: string; placeholder: string; required?: boolean; hint?: string };

const COMMON_SCHEDULE_FIELD: ConfigField = {
  key: "syncIntervalHours",
  label: "Sync Every (hours)",
  placeholder: "6",
  hint: "How often the scheduler re-fetches this source. Default: 6h for iCal/RSS/JSON, 24h for CSV.",
};

const SOURCE_CONFIG_FIELDS: Record<string, ConfigField[]> = {
  ticketmaster: [
    { key: "city", label: "City", placeholder: "Atlanta" },
    { key: "stateCode", label: "State Code", placeholder: "GA" },
    { key: "keyword", label: "Keyword Filter", placeholder: "music festival" },
    { key: "radius", label: "Radius (miles)", placeholder: "25" },
    { key: "classificationName", label: "Category Filter", placeholder: "Music" },
  ],
  google_sheets: [
    { key: "sheetId", label: "Google Sheet ID", placeholder: "1BxiMVs0XRA5…", required: true },
    { key: "tabName", label: "Tab Name", placeholder: "Event Intake" },
    COMMON_SCHEDULE_FIELD,
  ],
  ical: [
    { key: "url", label: "iCal Feed URL (.ics)", placeholder: "https://venue.com/events.ics", required: true },
    { key: "defaultCategory", label: "Default Category", placeholder: "Arts & Culture" },
    { key: "defaultNeighborhood", label: "Default Neighborhood", placeholder: "Midtown" },
    { key: "recurringWindowDays", label: "Recurring Window (days)", placeholder: "180", hint: "How far ahead to expand repeating events." },
    COMMON_SCHEDULE_FIELD,
  ],
  rss: [
    { key: "url", label: "RSS / Atom Feed URL", placeholder: "https://venue.com/feed", required: true },
    { key: "defaultCategory", label: "Default Category", placeholder: "Arts & Culture" },
    { key: "defaultNeighborhood", label: "Default Neighborhood", placeholder: "Midtown" },
    COMMON_SCHEDULE_FIELD,
  ],
  json_api: [
    { key: "url", label: "API Endpoint URL", placeholder: "https://api.venue.com/events", required: true },
    { key: "eventsPath", label: "Events Array Path", placeholder: "data.events", hint: "Dot-path to the events array in the JSON response. Leave blank if root is the array." },
    { key: "defaultCategory", label: "Default Category", placeholder: "Arts & Culture" },
    { key: "defaultNeighborhood", label: "Default Neighborhood", placeholder: "Midtown" },
    COMMON_SCHEDULE_FIELD,
  ],
  csv_url: [
    { key: "url", label: "CSV File URL", placeholder: "https://venue.com/events.csv", required: true },
    { key: "delimiter", label: "Delimiter", placeholder: "," },
    { key: "defaultCategory", label: "Default Category", placeholder: "Arts & Culture" },
    { key: "defaultNeighborhood", label: "Default Neighborhood", placeholder: "Midtown" },
    COMMON_SCHEDULE_FIELD,
  ],
  eventbrite: [
    { key: "organizationIds", label: "Organization IDs", placeholder: "123456789, 987654321", required: true, hint: "Comma-separated Eventbrite organization IDs (Eventbrite retired public search — events are pulled per organizer)." },
    { key: "defaultCategory", label: "Default Category", placeholder: "Community" },
    { key: "defaultNeighborhood", label: "Default Neighborhood", placeholder: "Midtown" },
    COMMON_SCHEDULE_FIELD,
  ],
  meetup: [
    { key: "query", label: "Keyword Filter", placeholder: "tech, hiking… (optional)" },
    { key: "radiusMiles", label: "Radius (miles)", placeholder: "30" },
    { key: "defaultCategory", label: "Default Category", placeholder: "Community" },
    COMMON_SCHEDULE_FIELD,
  ],
  bandsintown: [
    { key: "artists", label: "Artists to Track", placeholder: "Killer Mike, Mastodon", required: true, hint: "Comma-separated artist names — the Bandsintown public API is artist-centric. Only Atlanta-metro dates are kept." },
    COMMON_SCHEDULE_FIELD,
  ],
  seatgeek: [
    { key: "range", label: "Radius", placeholder: "30mi" },
    { key: "taxonomies", label: "Taxonomy Filter", placeholder: "concert, comedy (optional)" },
    { key: "maxPages", label: "Max Pages", placeholder: "3" },
    COMMON_SCHEDULE_FIELD,
  ],
  manual: [],
};

// Config keys that should be parsed from a comma-separated string into an array
const LIST_CONFIG_KEYS: Record<string, string[]> = {
  eventbrite: ["organizationIds"],
  bandsintown: ["artists"],
};

const SYNC_STATUS_COLORS: Record<string, string> = {
  idle: "bg-brand-cream text-foreground",
  running: "bg-brand-sky text-foreground",
  success: "bg-brand-lime text-foreground",
  error: "bg-brand-red text-white",
  partial: "bg-brand-yellow text-brand-yellow-foreground",
};

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

// ── Package + add-on pricing metadata ────────────────────────────────────────
const EVENT_PACKAGES = [
  { id: "free",      label: "Free",      price: 0,   desc: "Basic listing" },
  { id: "basic",     label: "Basic",     price: 149, desc: "Standard listing" },
  { id: "featured",  label: "Featured",  price: 399, desc: "Featured placement + highlights" },
  { id: "premier",   label: "Premier",   price: 649, desc: "Premier badge + image + ticket link" },
  { id: "signature", label: "Signature", price: 999, desc: "Full-service concierge listing" },
] as const;

const PACKAGE_PRICES: Record<string, number> = Object.fromEntries(
  EVENT_PACKAGES.map((p) => [p.id, p.price]),
);

const ADD_ON_OPTIONS = [
  { id: "newsletter",         label: "Newsletter Feature",       price: 75  },
  { id: "instagram_feature",  label: "Instagram Feature Post",   price: 99  },
  { id: "sponsored_route",    label: "Sponsored Route Inclusion", price: 149 },
  { id: "homepage_spotlight", label: "Homepage Spotlight",        price: 199 },
];

const PAYMENT_STATUSES = ["unpaid", "invoiced", "paid", "waived", "refunded"];

function computeListingPrice(pkg: string, addOns: string[]): number {
  const base = PACKAGE_PRICES[pkg] ?? 0;
  const extra = addOns.reduce((sum, ao) => sum + (ADD_ON_OPTIONS.find((o) => o.id === ao)?.price ?? 0), 0);
  return base + extra;
}

type AuditEntry = {
  id: string;
  eventId: string;
  changedBy: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  note: string | null;
  changedAt: string;
};

async function fetchAuditLog(eventId: string, adminKey: string): Promise<AuditEntry[]> {
  const res = await fetch(`${API_BASE}/admin/events/${eventId}/audit`, {
    headers: { "x-admin-key": adminKey },
  });
  if (!res.ok) throw new Error("Failed to load audit log");
  return res.json() as Promise<AuditEntry[]>;
}

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
  selected = false,
  onSelect,
}: {
  event: AdminEventRecord;
  adminKey: string;
  onUpdated: () => void;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Draft state for edit mode — initialised from the current event record
  const [draft, setDraft] = useState({
    listingPackage: (event.listingPackage ?? event.tier ?? "free") as string,
    addOns: (event.addOns ?? []) as string[],
    listingPrice: event.listingPrice ?? null as number | null,
    paymentStatus: event.paymentStatus ?? "unpaid",
    name: event.name,
    category: event.category,
    date: event.date,
    time: event.time ?? "",
    venue: event.venue,
    address: event.address ?? "",
    neighborhood: event.neighborhood,
    description: event.description ?? "",
    highlights: (event.highlights ?? []).join("\n"),
    imageUrl: (event as AdminEventRecord & { imageUrl?: string | null }).imageUrl ?? "",
    ticketUrl: (event as AdminEventRecord & { ticketUrl?: string | null }).ticketUrl ?? "",
    url: event.url ?? "",
    cost: event.cost ?? "",
    instagram: (event.instagram ?? []).join(", "),
    tags: (event as AdminEventRecord & { tags?: string[] | null }).tags?.join(", ") ?? "",
    ageCategory: (event as AdminEventRecord & { ageCategory?: string | null }).ageCategory ?? "",
    contactName: event.contactName ?? "",
    contactEmail: event.contactEmail ?? "",
    contactPhone: event.contactPhone ?? "",
    promoContactMethod: event.promoContactMethod ?? "",
    isFeatured: event.isFeatured,
    isBonusStamp: event.isBonusStamp,
    adminNotes: event.adminNotes ?? "",
    assignedTo: event.assignedTo ?? "",
  });

  const computedPrice = computeListingPrice(draft.listingPackage, draft.addOns);
  const effectivePrice = draft.listingPrice !== null ? draft.listingPrice : computedPrice;

  const adminActor = useAdminActor();
  const updateMutation = useUpdateAdminEvent({
    request: {
      headers: {
        "x-admin-key": adminKey,
        ...(adminActor ? { "x-admin-actor": encodeURIComponent(adminActor) } : {}),
      },
    },
    mutation: {
      onSuccess: () => {
        onUpdated();
        setEditMode(false);
      },
    },
  });

  const dispatch = (status: string) => {
    updateMutation.mutate({ id: event.id, data: { workflowStatus: status } });
  };

  const saveEdits = (republish = false) => {
    setSaveMsg(null);
    const body = {
      listingPackage: draft.listingPackage,
      addOns: draft.addOns,
      listingPrice: draft.listingPrice !== null ? draft.listingPrice : computedPrice,
      paymentStatus: draft.paymentStatus,
      name: draft.name,
      category: draft.category,
      date: draft.date,
      time: draft.time || undefined,
      venue: draft.venue,
      address: draft.address || undefined,
      neighborhood: draft.neighborhood,
      description: draft.description || undefined,
      highlights: draft.highlights.split("\n").map((s) => s.trim()).filter(Boolean),
      imageUrl: draft.imageUrl || undefined,
      ticketUrl: draft.ticketUrl || undefined,
      instagram: draft.instagram.split(",").map((s) => s.trim()).filter(Boolean),
      cost: draft.cost || undefined,
      url: draft.url || undefined,
      tags: draft.tags.split(",").map((s) => s.trim()).filter(Boolean),
      ageCategory: draft.ageCategory || undefined,
      contactName: draft.contactName || undefined,
      contactEmail: draft.contactEmail || undefined,
      contactPhone: draft.contactPhone || undefined,
      promoContactMethod: draft.promoContactMethod || undefined,
      isFeatured: draft.isFeatured,
      isBonusStamp: draft.isBonusStamp,
      adminNotes: draft.adminNotes || undefined,
      assignedTo: draft.assignedTo || undefined,
      ...(republish ? { workflowStatus: "published" } : {}),
    };
    updateMutation.mutate({ id: event.id, data: body });
  };

  const loadAudit = async () => {
    setAuditLoading(true);
    try {
      const entries = await fetchAuditLog(event.id, adminKey);
      setAuditLog(entries);
    } catch {
      setAuditLog([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const toggleHistory = () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next && auditLog.length === 0) void loadAudit();
  };

  const wfCls = WORKFLOW_COLORS[event.workflowStatus] ?? "bg-brand-cream text-foreground";
  const actions = getActions(event.workflowStatus);

  const pkg = event.listingPackage ?? event.tier ?? "free";
  const pkgLabel = EVENT_PACKAGES.find((p) => p.id === pkg)?.label ?? pkg.toUpperCase();
  const pkgCls = pkg === "signature"
    ? "bg-brand-navy text-white"
    : pkg === "premier"
    ? "bg-foreground text-[hsl(var(--brand-cream))]"
    : pkg === "featured"
    ? "bg-brand-red text-white"
    : pkg === "basic"
    ? "bg-brand-sky text-foreground"
    : "bg-foreground/10 text-foreground";

  const inputCls = "w-full border-2 border-foreground rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-yellow";
  const labelCls = "block text-[10px] font-black uppercase tracking-widest opacity-70 mb-0.5";

  return (
    <div className={`card-pop bg-white p-4 transition-shadow ${selected ? "ring-2 ring-brand-yellow" : ""}`}>
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {onSelect && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              className="mt-0.5 shrink-0 text-foreground/40 hover:text-foreground transition-colors"
              aria-label={selected ? "Deselect" : "Select"}
            >
              {selected ? <CheckSquare className="w-4 h-4 text-brand-yellow" /> : <Square className="w-4 h-4" />}
            </button>
          )}
          <div className="min-w-0">
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
        </div>
        <div className="flex flex-wrap gap-1.5 items-start shrink-0">
          <span className={`badge-sticker ${wfCls} text-[9px]`}>
            {event.workflowStatus.replace(/_/g, " ").toUpperCase()}
          </span>
          <span className={`badge-sticker ${pkgCls} text-[9px]`}>{pkgLabel}</span>
          <span className="badge-sticker bg-foreground/10 text-[9px]">{event.completenessScore}%</span>
          {event.isFeatured && (
            <span className="badge-sticker bg-brand-yellow text-brand-yellow-foreground text-[9px]">FEATURED</span>
          )}
          {event.isBonusStamp && (
            <span className="badge-sticker bg-brand-orange text-white text-[9px]">BONUS STAMP</span>
          )}
          {event.paymentStatus && event.paymentStatus !== "unpaid" && (
            <span className={`badge-sticker text-[9px] ${event.paymentStatus === "paid" ? "bg-brand-lime text-foreground" : event.paymentStatus === "invoiced" ? "bg-brand-sky text-foreground" : "bg-foreground/10 text-foreground"}`}>
              {event.paymentStatus.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Quick info */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/70 mb-2">
        {event.date && <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{event.date}</span>}
        {event.time && <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{event.time}</span>}
        {event.venue && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue}</span>}
        {event.cost && <span className="inline-flex items-center gap-1"><Ticket className="w-3 h-3" />{event.cost}</span>}
        {event.listingPrice != null && (
          <span className="inline-flex items-center gap-1 text-brand-lime-foreground font-bold">
            <DollarSign className="w-3 h-3" />${event.listingPrice} listing fee
          </span>
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
        <label className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest cursor-pointer border-2 border-foreground rounded-lg px-2 py-1 bg-white hover:bg-[hsl(var(--brand-cream))]">
          <input
            type="checkbox"
            checked={event.isBonusStamp}
            disabled={updateMutation.isPending}
            onChange={(e) =>
              updateMutation.mutate({ id: event.id, data: { isBonusStamp: e.target.checked } })
            }
            className="w-3.5 h-3.5 accent-[hsl(var(--brand-orange))]"
          />
          Create Bonus Stamp
        </label>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mt-1">
        <button
          type="button"
          onClick={() => { setExpanded((v) => !v); setEditMode(false); }}
          className="text-[10px] font-display uppercase tracking-widest text-foreground/50 hover:text-foreground flex items-center gap-1"
        >
          {expanded && !editMode ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded && !editMode ? "Hide" : "Details"}
        </button>
        <button
          type="button"
          onClick={() => { setEditMode((v) => !v); setExpanded(true); }}
          className={`text-[10px] font-display uppercase tracking-widest flex items-center gap-1 ${editMode ? "text-brand-yellow font-bold" : "text-foreground/50 hover:text-foreground"}`}
        >
          <Pencil className="w-3 h-3" />
          {editMode ? "Editing…" : "Edit"}
        </button>
        <button
          type="button"
          onClick={toggleHistory}
          className="text-[10px] font-display uppercase tracking-widest text-foreground/50 hover:text-foreground flex items-center gap-1"
        >
          <History className="w-3 h-3" />
          History
        </button>
      </div>

      {/* ── Expanded read-only view ── */}
      {expanded && !editMode && (
        <div className="mt-3 space-y-3 border-t-2 border-dashed border-foreground/20 pt-3">
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
          {(event as AdminEventRecord & { imageUrl?: string | null }).imageUrl && (
            <a
              href={(event as AdminEventRecord & { imageUrl?: string | null }).imageUrl!}
              target="_blank"
              rel="noreferrer"
              className="block w-full max-w-sm"
            >
              <img
                src={(event as AdminEventRecord & { imageUrl?: string | null }).imageUrl!}
                alt={`${event.name} event photo`}
                loading="lazy"
                className="w-full aspect-video object-cover border-2 border-foreground rounded-lg"
              />
            </a>
          )}
          {event.description && (
            <div className="bg-brand-cream border-2 border-foreground rounded-lg p-3 text-sm">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Description</div>
              <p className="whitespace-pre-wrap leading-snug">{event.description}</p>
            </div>
          )}
          {event.highlights && event.highlights.length > 0 && (
            <div className="bg-brand-cream border-2 border-foreground rounded-lg p-3 text-sm">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Highlights</div>
              <ul className="space-y-0.5">
                {event.highlights.map((h, i) => <li key={i} className="flex gap-1.5"><span className="opacity-40">·</span>{h}</li>)}
              </ul>
            </div>
          )}
          {event.intakeNotes && (
            <div className="bg-white border-2 border-foreground rounded-lg p-3 text-sm">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Submitter Notes</div>
              <p className="whitespace-pre-wrap leading-snug">{event.intakeNotes}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
            {event.url && (
              <a href={event.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:underline md:truncate">
                <Globe className="w-3.5 h-3.5 shrink-0" /> Website
              </a>
            )}
            {(event as AdminEventRecord & { ticketUrl?: string | null }).ticketUrl && (
              <a href={(event as AdminEventRecord & { ticketUrl?: string | null }).ticketUrl!} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:underline">
                <Ticket className="w-3.5 h-3.5 shrink-0" /> Tickets
              </a>
            )}
            {(event as AdminEventRecord & { imageUrl?: string | null }).imageUrl && (
              <a href={(event as AdminEventRecord & { imageUrl?: string | null }).imageUrl!} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:underline">
                <Image className="w-3.5 h-3.5 shrink-0" /> Image
              </a>
            )}
          </div>
          {event.adminNotes && (
            <div className="bg-brand-yellow/20 border-2 border-foreground rounded-lg p-3 text-sm">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Admin Notes</div>
              <p className="whitespace-pre-wrap leading-snug">{event.adminNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Edit mode panel ── */}
      {editMode && (
        <div className="mt-3 border-t-2 border-brand-yellow border-dashed pt-3 space-y-5">

          {/* § Package & Pricing */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3 h-3" /> Package & Pricing
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mb-3">
              {EVENT_PACKAGES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, listingPackage: p.id, listingPrice: null }))}
                  className={`border-2 border-foreground rounded-lg px-2 py-2 text-center text-xs transition-colors ${draft.listingPackage === p.id ? "bg-brand-yellow text-foreground font-black" : "bg-white hover:bg-brand-cream"}`}
                >
                  <div className="font-black">{p.label}</div>
                  <div className="opacity-60">${p.price}</div>
                </button>
              ))}
            </div>
            <div className="mb-2">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1.5">Add-ons</div>
              <div className="flex flex-wrap gap-2">
                {ADD_ON_OPTIONS.map((ao) => (
                  <label key={ao.id} className={`inline-flex items-center gap-1.5 border-2 border-foreground rounded-lg px-2.5 py-1.5 text-xs cursor-pointer select-none ${draft.addOns.includes(ao.id) ? "bg-brand-sky text-foreground font-bold" : "bg-white hover:bg-brand-cream"}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={draft.addOns.includes(ao.id)}
                      onChange={(e) => setDraft((d) => ({
                        ...d,
                        addOns: e.target.checked
                          ? [...d.addOns, ao.id]
                          : d.addOns.filter((x) => x !== ao.id),
                        listingPrice: null,
                      }))}
                    />
                    {ao.label} <span className="opacity-60">+${ao.price}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[140px]">
                <label className={labelCls}>Listing Fee (computed: ${computedPrice})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-foreground/60">$</span>
                  <input
                    type="number"
                    min="0"
                    value={draft.listingPrice !== null ? draft.listingPrice : ""}
                    onChange={(e) => setDraft((d) => ({ ...d, listingPrice: e.target.value === "" ? null : Number(e.target.value) }))}
                    placeholder={String(computedPrice)}
                    className={`${inputCls} pl-6`}
                  />
                </div>
                {draft.listingPrice !== null && draft.listingPrice !== computedPrice && (
                  <button
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, listingPrice: null }))}
                    className="text-[10px] text-foreground/50 hover:text-foreground mt-0.5"
                  >
                    Reset to computed (${computedPrice})
                  </button>
                )}
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className={labelCls}>Payment Status</label>
                <select
                  value={draft.paymentStatus}
                  onChange={(e) => setDraft((d) => ({ ...d, paymentStatus: e.target.value }))}
                  className={inputCls}
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="text-right text-sm font-black whitespace-nowrap">
                Total: <span className="text-lg">${effectivePrice}</span>
              </div>
            </div>
            {(event.listingPackage ?? event.tier ?? "free") === "free" &&
              draft.listingPackage !== "free" &&
              draft.paymentStatus === "unpaid" && (
                <div className="mt-2 flex items-start gap-2 rounded-lg border-2 border-brand-yellow bg-brand-yellow/20 px-3 py-2 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-foreground mt-0.5" />
                  <span>
                    You're upgrading this free listing to a paid package, but payment status is
                    still <strong>Unpaid</strong>. Remember to invoice the organizer and update the
                    payment status.
                  </span>
                </div>
              )}
          </div>

          {/* § Event Details */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Event Details
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Name</label>
                <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} className={inputCls}>
                  <option value="">— select —</option>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Date</label>
                <input value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Time</label>
                <input value={draft.time} onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))} className={inputCls} placeholder="7:00 PM" />
              </div>
              <div>
                <label className={labelCls}>Venue</label>
                <input value={draft.venue} onChange={(e) => setDraft((d) => ({ ...d, venue: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Neighborhood</label>
                <input value={draft.neighborhood} onChange={(e) => setDraft((d) => ({ ...d, neighborhood: e.target.value }))} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Address</label>
                <input value={draft.address} onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Ticket Price (display)</label>
                <input value={draft.cost} onChange={(e) => setDraft((d) => ({ ...d, cost: e.target.value }))} className={inputCls} placeholder="$25 / Free" />
              </div>
              <div>
                <label className={labelCls}>Age Category</label>
                <select value={draft.ageCategory} onChange={(e) => setDraft((d) => ({ ...d, ageCategory: e.target.value }))} className={inputCls}>
                  <option value="">— select —</option>
                  {AGE_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Tags (comma-separated)</label>
                <input value={draft.tags} onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))} className={inputCls} placeholder="music, family, outdoor" />
              </div>
            </div>
          </div>

          {/* § Content */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <FileText className="w-3 h-3" /> Content
            </div>
            <div className="space-y-2">
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  rows={4}
                  className={`${inputCls} resize-none`}
                  placeholder="Event description…"
                />
              </div>
              <div>
                <label className={labelCls}>Highlights (one per line)</label>
                <textarea
                  value={draft.highlights}
                  onChange={(e) => setDraft((d) => ({ ...d, highlights: e.target.value }))}
                  rows={3}
                  className={`${inputCls} resize-none`}
                  placeholder={"Live music\nFood trucks\nFree parking"}
                />
              </div>
              <div>
                <label className={labelCls}><Image className="inline w-3 h-3 mr-1" />Image URL</label>
                <input value={draft.imageUrl} onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))} className={inputCls} placeholder="https://…" />
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}><Globe className="inline w-3 h-3 mr-1" />Website URL</label>
                  <input value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} className={inputCls} placeholder="https://…" />
                </div>
                <div>
                  <label className={labelCls}><Ticket className="inline w-3 h-3 mr-1" />Ticket URL</label>
                  <input value={draft.ticketUrl} onChange={(e) => setDraft((d) => ({ ...d, ticketUrl: e.target.value }))} className={inputCls} placeholder="https://eventbrite.com/…" />
                </div>
                <div>
                  <label className={labelCls}><Instagram className="inline w-3 h-3 mr-1" />Instagram (comma-separated)</label>
                  <input value={draft.instagram} onChange={(e) => setDraft((d) => ({ ...d, instagram: e.target.value }))} className={inputCls} placeholder="@handle1, @handle2" />
                </div>
              </div>
            </div>
          </div>

          {/* § Contact */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <User className="w-3 h-3" /> Contact
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Name</label>
                <input value={draft.contactName} onChange={(e) => setDraft((d) => ({ ...d, contactName: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={draft.contactEmail} onChange={(e) => setDraft((d) => ({ ...d, contactEmail: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input value={draft.contactPhone} onChange={(e) => setDraft((d) => ({ ...d, contactPhone: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Promo Contact Method</label>
                <select value={draft.promoContactMethod} onChange={(e) => setDraft((d) => ({ ...d, promoContactMethod: e.target.value }))} className={inputCls}>
                  <option value="">Not requested</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>
          </div>

          {/* § Feature Flags + Admin */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Tag className="w-3 h-3" /> Admin
            </div>
            <div className="flex flex-wrap gap-3 mb-3">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-sm">
                <input
                  type="checkbox"
                  checked={draft.isFeatured}
                  onChange={(e) => setDraft((d) => ({ ...d, isFeatured: e.target.checked }))}
                  className="w-4 h-4 border-2 border-foreground rounded"
                />
                <span className="font-bold">Featured</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-sm">
                <input
                  type="checkbox"
                  checked={draft.isBonusStamp}
                  onChange={(e) => setDraft((d) => ({ ...d, isBonusStamp: e.target.checked }))}
                  className="w-4 h-4 border-2 border-foreground rounded"
                />
                <span className="font-bold">Bonus Stamp</span>
              </label>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Assigned To</label>
                <input value={draft.assignedTo} onChange={(e) => setDraft((d) => ({ ...d, assignedTo: e.target.value }))} className={inputCls} placeholder="Team member…" />
              </div>
            </div>
            <div className="mt-2">
              <label className={labelCls}>Admin Notes</label>
              <textarea
                value={draft.adminNotes}
                onChange={(e) => setDraft((d) => ({ ...d, adminNotes: e.target.value }))}
                rows={2}
                className={`${inputCls} resize-none`}
                placeholder="Internal notes…"
              />
            </div>
          </div>

          {/* Save buttons */}
          {saveMsg && (
            <div className="text-xs text-brand-red font-bold">{saveMsg}</div>
          )}
          <div className="flex flex-wrap gap-2 pt-1 border-t-2 border-dashed border-foreground/20">
            <button
              type="button"
              disabled={updateMutation.isPending}
              onClick={() => saveEdits(false)}
              className="button-pop button-pop-yellow text-sm px-4 py-2 inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </button>
            {event.workflowStatus !== "pending" && (
              <button
                type="button"
                disabled={updateMutation.isPending}
                onClick={() => saveEdits(true)}
                className="button-pop bg-brand-navy text-white text-sm px-4 py-2 inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Save & Republish
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="button-pop bg-white text-sm px-4 py-2 text-foreground/60 hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Audit / History panel ── */}
      {showHistory && (
        <div className="mt-3 border-t-2 border-dashed border-foreground/20 pt-3">
          <div className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <History className="w-3 h-3" /> Change History
            <button type="button" onClick={loadAudit} className="ml-auto text-foreground/40 hover:text-foreground">
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          {auditLoading ? (
            <div className="text-xs text-foreground/50 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading…
            </div>
          ) : auditLog.length === 0 ? (
            <p className="text-xs text-foreground/40">No changes recorded yet.</p>
          ) : (
            <div className="space-y-1.5">
              {auditLog.map((entry) => (
                <div key={entry.id} className="text-xs rounded-lg border-2 border-foreground/10 bg-foreground/5 px-3 py-2">
                  <div className="flex justify-between items-center gap-2 mb-0.5">
                    <span className="font-bold">{entry.field}</span>
                    <span className="text-foreground/50 truncate" title={entry.changedBy}>
                      by {entry.changedBy}
                    </span>
                    <span className="text-foreground/40 shrink-0 ml-auto">
                      {new Date(entry.changedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 items-center text-foreground/70">
                    {entry.oldValue !== null && (
                      <span className="bg-brand-red/10 text-foreground px-1.5 py-0.5 rounded line-through opacity-60 max-w-[180px] truncate">{entry.oldValue}</span>
                    )}
                    {entry.oldValue !== null && <ArrowRight className="w-3 h-3 shrink-0" />}
                    {entry.newValue !== null && (
                      <span className="bg-brand-lime/30 text-foreground px-1.5 py-0.5 rounded max-w-[200px] truncate">{entry.newValue}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SourcesPanel ─────────────────────────────────────────────────────────────

function SourcesPanel({ adminKey }: { adminKey: string }) {
  const [sources, setSources] = useState<EventSourceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<{ id: string; msg: string; ok: boolean } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<CredentialsInfo | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("manual");
  const [formConfig, setFormConfig] = useState<Record<string, string>>({});
  const [formActive, setFormActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [srcs, creds] = await Promise.all([listSources(adminKey), fetchCredentials(adminKey)]);
      setSources(srcs);
      setCredentials(creds);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sources");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => { void load(); }, [load]);

  const openAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormType("manual");
    setFormConfig({});
    setFormActive(true);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (s: EventSourceRecord) => {
    setEditingId(s.id);
    setFormName(s.name);
    setFormType(s.type);
    try {
      const parsed = JSON.parse(s.config) as Record<string, unknown>;
      const flat: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        flat[k] = Array.isArray(v) ? v.join(", ") : String(v ?? "");
      }
      setFormConfig(flat);
    } catch { setFormConfig({}); }
    setFormActive(s.isActive);
    setFormError(null);
    setShowForm(true);
  };

  const cancelForm = () => { setShowForm(false); setEditingId(null); };

  const saveForm = async () => {
    if (!formName.trim()) { setFormError("Name is required"); return; }
    const configFields = SOURCE_CONFIG_FIELDS[formType] ?? [];
    for (const f of configFields) {
      if (f.required && !formConfig[f.key]?.trim()) {
        setFormError(`${f.label} is required for ${SOURCE_TYPE_LABELS[formType] ?? formType}`);
        return;
      }
    }
    setFormSaving(true);
    setFormError(null);
    // Comma-separated list fields (e.g. Eventbrite org IDs, Bandsintown artists)
    // are stored as arrays in the source config.
    const listKeys = LIST_CONFIG_KEYS[formType] ?? [];
    const outConfig: Record<string, unknown> = { ...formConfig };
    for (const key of listKeys) {
      const rawVal = formConfig[key];
      if (typeof rawVal === "string") {
        outConfig[key] = rawVal.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
    try {
      if (editingId) {
        await upsertSource("PATCH", editingId, { name: formName.trim(), type: formType, config: outConfig, isActive: formActive }, adminKey);
      } else {
        await upsertSource("POST", "", { name: formName.trim(), type: formType, config: outConfig, isActive: formActive }, adminKey);
      }
      setShowForm(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setFormSaving(false);
    }
  };

  const doSync = async (id: string) => {
    setSyncingId(id);
    setSyncMsg(null);
    try {
      const run = await triggerSync(id, adminKey);
      const fetched = run.found ?? 0;
      const status = run.errors > 0 && run.inserted === 0 ? "⚠️" : "✅";
      const msg = `${status} Done — ${fetched} fetched, ${run.inserted} inserted, ${run.duplicates} duplicates, ${run.changed} seen, ${run.errors} errors`;

      setSyncMsg({ id, msg, ok: true });
      await load();
    } catch (e) {
      setSyncMsg({ id, msg: `❌ ${e instanceof Error ? e.message : "Sync failed"}`, ok: false });
    } finally {
      setSyncingId(null);
    }
  };

  const doToggle = async (s: EventSourceRecord) => {
    try {
      await upsertSource("PATCH", s.id, { isActive: !s.isActive }, adminKey);
      await load();
    } catch { /* ignore */ }
  };

  const doDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await removeSource(id, adminKey);
      await load();
    } catch { /* ignore */ } finally {
      setDeletingId(null);
    }
  };

  const doTest = async (id: string) => {
    setTestingId(id);
    setTestResults((prev) => { const next = { ...prev }; delete next[id]; return next; });
    const result = await testSource(adminKey, id);
    setTestResults((prev) => ({ ...prev, [id]: result }));
    setTestingId(null);
  };

  const configFields = SOURCE_CONFIG_FIELDS[formType] ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-base" style={{ fontFamily: "Bungee, sans-serif" }}>Event Sources</h3>
          <p className="text-xs text-foreground/60 mt-0.5">
            Configure sources for automated event ingestion. All imports enter the review queue — auto-publish is always off.
          </p>
        </div>
        <button type="button" onClick={openAdd} className="button-pop button-pop-yellow text-sm px-3 py-2 shrink-0">
          + Add Source
        </button>
      </div>

      {/* Credential notice */}
      <div className="bg-brand-cream border-2 border-foreground rounded-xl p-3 text-xs space-y-1">
        <div className="font-black uppercase tracking-widest text-[10px]">API Credentials</div>
        {Object.entries(CONNECTOR_ENV_VARS).map(([type, envVar]) => {
          const set =
            credentials === null
              ? null
              : (credentials.connectors?.[type]?.set ??
                (type === "ticketmaster" ? credentials.ticketmasterKeySet : false));
          return (
            <div key={type} className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${set === null ? "bg-foreground/20" : set ? "bg-brand-lime" : "bg-brand-red"}`} />
              <span className="font-mono bg-white border border-foreground/20 px-1 rounded">{envVar}</span>
              <span>
                {set === null
                  ? "checking…"
                  : set
                    ? `Set — ${SOURCE_TYPE_LABELS[type] ?? type} syncs enabled`
                    : `Not set — ${SOURCE_TYPE_LABELS[type] ?? type} sources are awaiting credentials`}
              </span>
            </div>
          );
        })}
        <div><span className="font-mono bg-white border border-foreground/20 px-1 rounded">google-drive</span> connector — already connected (used for Google Sheets reads)</div>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="card-pop bg-white border-2 border-foreground p-4 space-y-3">
          <div className="font-black text-sm" style={{ fontFamily: "Bungee, sans-serif" }}>
            {editingId ? "Edit Source" : "Add New Source"}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-1">Source Name *</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Ticketmaster Atlanta"
                className="w-full border-2 border-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-1">Source Type *</label>
              <select
                value={formType}
                onChange={(e) => { setFormType(e.target.value); setFormConfig({}); }}
                className="w-full border-2 border-foreground rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              >
                {Object.entries(SOURCE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {configFields.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {configFields.map((f) => (
                <div key={f.key}>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1">
                    {f.label}{f.required ? " *" : ""}
                  </label>
                  <input
                    value={formConfig[f.key] ?? ""}
                    onChange={(e) => setFormConfig((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full border-2 border-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                  {f.hint && <p className="text-[10px] text-foreground/50 mt-1">{f.hint}</p>}
                </div>
              ))}
            </div>
          )}

          {CONNECTOR_ENV_VARS[formType] && (
            <p className="text-[10px] text-foreground/60 bg-brand-cream rounded-lg p-2">
              Requires the <span className="font-mono">{CONNECTOR_ENV_VARS[formType]}</span> environment secret. Without it the source stays configured but reports "awaiting credentials" on sync.
            </p>
          )}

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} className="w-4 h-4 accent-brand-yellow" />
            Active (enable auto-sync from admin panel)
          </label>

          {formError && <p className="text-sm text-brand-red font-bold">{formError}</p>}

          <div className="flex gap-2">
            <button type="button" onClick={cancelForm} className="button-pop text-sm px-3 py-2 bg-brand-cream text-foreground">Cancel</button>
            <button type="button" onClick={saveForm} disabled={formSaving} className="button-pop button-pop-yellow text-sm px-4 py-2 disabled:opacity-50 inline-flex items-center gap-2">
              {formSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editingId ? "Save Changes" : "Create Source"}
            </button>
          </div>
        </div>
      )}

      {/* Failing sources banner */}
      {!loading && sources.some((s) => s.consecutiveFailures >= FAILING_THRESHOLD) && (
        <div className="card-pop bg-brand-red/10 border-2 border-brand-red p-4 text-sm">
          <p className="font-black text-brand-red" style={{ fontFamily: "Bungee, sans-serif" }}>
            ⚠ {sources.filter((s) => s.consecutiveFailures >= FAILING_THRESHOLD).length} source
            {sources.filter((s) => s.consecutiveFailures >= FAILING_THRESHOLD).length !== 1 ? "s" : ""} failing repeatedly
          </p>
          <p className="mt-1 text-foreground/70">
            These sources have failed {FAILING_THRESHOLD}+ syncs in a row and may have a dead or changed feed URL — events from them are no longer coming in. Check the feed URL, then use Test / Sync Now to confirm the fix.
          </p>
        </div>
      )}

      {/* Source list */}
      {loading && <div className="card-pop bg-white p-8 text-center text-sm text-foreground/60">Loading sources…</div>}
      {error && <div className="text-sm text-brand-red font-bold">{error}</div>}

      {!loading && sources.length === 0 && !showForm && (
        <div className="card-pop bg-white p-10 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-black text-base" style={{ fontFamily: "Bungee, sans-serif" }}>No sources configured</p>
          <p className="text-sm text-foreground/60 mt-1">Add a source above to start ingesting events automatically.</p>
        </div>
      )}

      {sources.map((s) => (
        <div key={s.id} className={`card-pop bg-white p-4 ${!s.isActive ? "opacity-60" : ""} ${s.consecutiveFailures >= FAILING_THRESHOLD ? "border-2 border-brand-red" : ""}`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`badge-sticker text-[9px] shrink-0 ${SOURCE_TYPE_COLORS[s.type] ?? "bg-brand-cream"}`}>
                {SOURCE_TYPE_LABELS[s.type] ?? s.type}
              </span>
              <span className="font-black text-sm truncate">{s.name}</span>
              {!s.isActive && <span className="badge-sticker bg-foreground/10 text-[9px] shrink-0">Disabled</span>}
              {CONNECTOR_ENV_VARS[s.type] && credentials !== null &&
                !(credentials.connectors?.[s.type]?.set ?? (s.type === "ticketmaster" && credentials.ticketmasterKeySet)) && (
                <span className="badge-sticker bg-brand-orange text-white text-[9px] shrink-0">Awaiting credentials</span>
              )}
              {s.consecutiveFailures >= FAILING_THRESHOLD && (
                <span className="badge-sticker bg-brand-red text-white text-[9px] shrink-0">
                  ⚠ Failing ×{s.consecutiveFailures}
                </span>
              )}
              {s.consecutiveFailures === 1 && (
                <span className="badge-sticker bg-brand-yellow text-foreground text-[9px] shrink-0">Last sync failed</span>
              )}
            </div>
            <div className="flex gap-1.5 shrink-0 flex-wrap">
              {["ticketmaster", "ical", "rss", "json_api", "csv_url", "eventbrite", "meetup", "bandsintown", "seatgeek"].includes(s.type) && (
                <button
                  type="button"
                  onClick={() => void doTest(s.id)}
                  disabled={testingId === s.id || syncingId === s.id}
                  className="button-pop text-[10px] px-2 py-1 bg-brand-lime text-foreground inline-flex items-center gap-1 disabled:opacity-50"
                >
                  {testingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  Test
                </button>
              )}
              <button
                type="button"
                onClick={() => doSync(s.id)}
                disabled={syncingId === s.id || !s.isActive}
                className="button-pop text-[10px] px-2 py-1 bg-brand-navy text-white inline-flex items-center gap-1 disabled:opacity-50"
              >
                {syncingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Sync Now
              </button>
              <button type="button" onClick={() => doToggle(s)} className="button-pop text-[10px] px-2 py-1 bg-brand-cream text-foreground">
                {s.isActive ? "Disable" : "Enable"}
              </button>
              <button type="button" onClick={() => openEdit(s)} className="button-pop text-[10px] px-2 py-1 bg-brand-cream text-foreground">
                Edit
              </button>
              <button
                type="button"
                onClick={() => { if (window.confirm(`Delete source "${s.name}"?`)) void doDelete(s.id); }}
                disabled={deletingId === s.id}
                className="button-pop text-[10px] px-2 py-1 bg-brand-red text-white disabled:opacity-50"
              >
                {deletingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>

          {/* Last sync info */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-foreground/60">
            {s.lastSyncAt && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> {new Date(s.lastSyncAt).toLocaleString()}
              </span>
            )}
            <span className={`badge-sticker text-[9px] ${SYNC_STATUS_COLORS[s.lastSyncStatus] ?? "bg-brand-cream"}`}>
              {s.lastSyncStatus}
            </span>
            {s.lastSyncMessage && <span className="text-[11px]">{s.lastSyncMessage}</span>}
            {!s.lastSyncAt && <span className="text-foreground/40">Never synced</span>}
            {s.type !== "manual" && s.type !== "ticketmaster" && (() => {
              let interval: number | undefined;
              try { interval = (JSON.parse(s.config ?? "{}") as Record<string, unknown>).syncIntervalHours as number | undefined; } catch { /* ignore */ }
              const defaultsByType: Record<string, number> = { ical: 6, rss: 6, json_api: 6, csv_url: 24, google_sheets: 6 };
              const h = interval ?? defaultsByType[s.type] ?? 6;
              return <span className="inline-flex items-center gap-1 text-foreground/40">↻ every {h}h</span>;
            })()}
          </div>

          {syncMsg?.id === s.id && (
            <div className={`mt-2 text-xs font-bold ${syncMsg.ok ? "text-foreground" : "text-brand-red"}`}>
              {syncMsg.msg}
            </div>
          )}

          {testResults[s.id] && (
            <div className={`mt-2 text-xs rounded-lg border px-3 py-2 ${testResults[s.id].ok ? "border-brand-lime bg-brand-lime/10" : "border-brand-red/30 bg-brand-red/5"}`}>
              {testResults[s.id].ok ? (
                <>
                  <div className="font-bold">
                    ⚡ Test OK — {(testResults[s.id] as Extract<TestResult, { ok: true }>).found} event{(testResults[s.id] as Extract<TestResult, { ok: true }>).found !== 1 ? "s" : ""} found (nothing written)
                  </div>
                  {(testResults[s.id] as Extract<TestResult, { ok: true }>).sample.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-foreground/60">
                      {(testResults[s.id] as Extract<TestResult, { ok: true }>).sample.map((e, i) => (
                        <li key={i} className="truncate">· {e.name}{e.date ? ` — ${e.date}` : ""}{e.venue ? ` @ ${e.venue}` : ""}</li>
                      ))}
                      {(testResults[s.id] as Extract<TestResult, { ok: true }>).found > 5 && (
                        <li className="text-foreground/40">…and {(testResults[s.id] as Extract<TestResult, { ok: true }>).found - 5} more</li>
                      )}
                    </ul>
                  )}
                </>
              ) : (
                <div className="font-bold text-brand-red">❌ {(testResults[s.id] as Extract<TestResult, { ok: false }>).error}</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── ImportLogsPanel ───────────────────────────────────────────────────────────

function ImportLogsPanel({ adminKey }: { adminKey: string }) {
  const [runs, setRuns] = useState<ImportRunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rowsCache, setRowsCache] = useState<Record<string, ImportRunRowRecord[]>>({});
  const [rowsLoading, setRowsLoading] = useState(false);
  const [rowSearch, setRowSearch] = useState("");
  const [rowStatus, setRowStatus] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRuns(await listImportRuns(adminKey));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => { void load(); }, [load]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    setRowSearch("");
    setRowStatus("all");
    if (!rowsCache[id]) {
      setRowsLoading(true);
      try {
        const rows = await getRunRows(id, adminKey);
        setRowsCache((p) => ({ ...p, [id]: rows }));
      } catch { /* ignore */ } finally {
        setRowsLoading(false);
      }
    }
  };

  const RUN_STATUS_COLORS: Record<string, string> = {
    running: "bg-brand-sky text-foreground",
    success: "bg-brand-lime text-foreground",
    error: "bg-brand-red text-white",
    partial: "bg-brand-yellow text-brand-yellow-foreground",
  };

  const ROW_STATUS_COLORS: Record<string, string> = {
    inserted: "bg-brand-lime text-foreground",
    duplicate: "bg-brand-yellow text-brand-yellow-foreground",
    seen: "bg-brand-cream text-foreground",
    changed: "bg-brand-sky text-foreground",
    error: "bg-brand-red text-white",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-base" style={{ fontFamily: "Bungee, sans-serif" }}>Import Logs</h3>
          <p className="text-xs text-foreground/60 mt-0.5">History of all source sync runs.</p>
        </div>
        <button type="button" onClick={load} className="button-pop text-sm px-3 py-2 bg-white text-foreground inline-flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {loading && <div className="card-pop bg-white p-8 text-center text-sm text-foreground/60">Loading logs…</div>}
      {error && <div className="text-sm text-brand-red font-bold">{error}</div>}

      {!loading && runs.length === 0 && (
        <div className="card-pop bg-white p-10 text-center">
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-black text-base" style={{ fontFamily: "Bungee, sans-serif" }}>No import runs yet</p>
          <p className="text-sm text-foreground/60 mt-1">Trigger a sync from the Sources tab to see logs here.</p>
        </div>
      )}

      {runs.map((run) => {
        const isExpanded = expandedId === run.id;
        const rows = rowsCache[run.id];
        return (
          <div key={run.id} className="card-pop bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm">{run.sourceName ?? run.sourceId.slice(0, 8)}</span>
                  <span className={`badge-sticker text-[9px] ${RUN_STATUS_COLORS[run.status] ?? "bg-brand-cream"}`}>
                    {run.status}
                  </span>
                </div>
                <div className="text-xs text-foreground/60 mt-0.5">
                  {new Date(run.startedAt).toLocaleString()}
                  {run.finishedAt && ` · ${Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)}s`}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span className="badge-sticker bg-foreground/10">{run.found} found</span>
                {run.inserted > 0 && <span className="badge-sticker bg-brand-lime text-foreground">{run.inserted} inserted</span>}
                {run.duplicates > 0 && <span className="badge-sticker bg-brand-yellow text-brand-yellow-foreground">{run.duplicates} dup</span>}
                {run.changed > 0 && <span className="badge-sticker bg-brand-sky text-foreground">{run.changed} seen</span>}
                {run.errors > 0 && <span className="badge-sticker bg-brand-red text-white">{run.errors} error</span>}
              </div>
            </div>

            {run.errorDetail && (
              <div className="mt-2 text-xs text-brand-red font-mono bg-red-50 rounded p-2">{run.errorDetail}</div>
            )}

            <button
              type="button"
              onClick={() => toggleExpand(run.id)}
              className="text-[10px] font-display uppercase tracking-widest text-foreground/50 hover:text-foreground flex items-center gap-1 mt-2"
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {isExpanded ? "Hide rows" : "Show rows"}
            </button>

            {isExpanded && (
              <div className="mt-3 border-t-2 border-dashed border-foreground/20 pt-3">
                {rows && rows.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    <input
                      type="text"
                      value={rowSearch}
                      onChange={(e) => setRowSearch(e.target.value)}
                      placeholder="Search rows (name, venue, error)…"
                      className="text-xs border-2 border-foreground/20 rounded-lg px-2.5 py-1.5 w-56 focus:outline-none focus:border-foreground"
                    />
                    <select
                      value={rowStatus}
                      onChange={(e) => setRowStatus(e.target.value)}
                      className="text-xs border-2 border-foreground/20 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-foreground"
                    >
                      <option value="all">All statuses</option>
                      <option value="inserted">Inserted</option>
                      <option value="duplicate">Duplicate</option>
                      <option value="changed">Changed</option>
                      <option value="seen">Seen</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                )}
                {rowsLoading && !rows ? (
                  <div className="text-xs text-center py-4 text-foreground/50">Loading rows…</div>
                ) : rows && rows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[480px]">
                      <thead>
                        <tr className="border-b border-foreground/10">
                          <th className="text-left py-1 px-2 font-black uppercase tracking-widest text-[9px]">Status</th>
                          <th className="text-left py-1 px-2 font-black uppercase tracking-widest text-[9px]">Name</th>
                          <th className="text-left py-1 px-2 font-black uppercase tracking-widest text-[9px]">Date</th>
                          <th className="text-left py-1 px-2 font-black uppercase tracking-widest text-[9px]">Venue</th>
                          <th className="text-left py-1 px-2 font-black uppercase tracking-widest text-[9px]">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.filter((r) => {
                          if (rowStatus !== "all" && r.status !== rowStatus) return false;
                          if (!rowSearch.trim()) return true;
                          const q = rowSearch.trim().toLowerCase();
                          return (
                            (r.rawName ?? "").toLowerCase().includes(q) ||
                            (r.rawVenue ?? "").toLowerCase().includes(q) ||
                            (r.errorMessage ?? "").toLowerCase().includes(q)
                          );
                        }).map((r) => (
                          <tr key={r.id} className="border-b border-foreground/5 last:border-0">
                            <td className="py-1 px-2">
                              <span className={`badge-sticker text-[8px] ${ROW_STATUS_COLORS[r.status] ?? "bg-brand-cream"}`}>{r.status}</span>
                            </td>
                            <td className="py-1 px-2 max-w-[160px] truncate">{r.rawName ?? "—"}</td>
                            <td className="py-1 px-2 whitespace-nowrap">{r.rawDate ?? "—"}</td>
                            <td className="py-1 px-2 max-w-[120px] truncate">{r.rawVenue ?? "—"}</td>
                            <td className="py-1 px-2 text-foreground/50 max-w-[140px] truncate">{r.errorMessage ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-xs text-foreground/50 text-center py-2">No row-level data recorded.</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── DuplicatesPanel ───────────────────────────────────────────────────────────

function DuplicatesPanel({ adminKey, onChanged }: { adminKey: string; onChanged: () => void }) {
  const [pairs, setPairs] = useState<DuplicatePair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPairs(await listDuplicates(adminKey));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load duplicates");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => { void load(); }, [load]);

  const resolve = async (id: string, resolution: "pending" | "archived") => {
    setProcessingId(id);
    try {
      await bulkUpdateStatus([id], resolution, adminKey);
      await load();
      onChanged();
    } catch { /* ignore */ } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-base" style={{ fontFamily: "Bungee, sans-serif" }}>Possible Duplicates</h3>
          <p className="text-xs text-foreground/60 mt-0.5">Events that closely match an existing record — review each pair and decide.</p>
        </div>
        <button type="button" onClick={load} className="button-pop text-sm px-3 py-2 bg-white text-foreground inline-flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {loading && <div className="card-pop bg-white p-8 text-center text-sm text-foreground/60">Loading…</div>}
      {error && <div className="text-sm text-brand-red font-bold">{error}</div>}

      {!loading && pairs.length === 0 && (
        <div className="card-pop bg-white p-10 text-center">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-black text-base" style={{ fontFamily: "Bungee, sans-serif" }}>No duplicates to review</p>
          <p className="text-sm text-foreground/60 mt-1">Events that match existing records will appear here for your decision.</p>
        </div>
      )}

      {pairs.map(({ flagged, original }) => (
        <div key={flagged.id} className="card-pop bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Possible Duplicate Pair</div>
            {typeof flagged.duplicateConfidence === "number" && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  flagged.duplicateConfidence >= 85
                    ? "bg-brand-red/20 text-brand-red"
                    : flagged.duplicateConfidence >= 75
                      ? "bg-brand-yellow/40 text-yellow-900"
                      : "bg-foreground/10 text-foreground/60"
                }`}
              >
                {flagged.duplicateConfidence}% match confidence
              </span>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Flagged (new incoming) */}
            <div className="bg-brand-yellow/10 border-2 border-brand-yellow rounded-xl p-3">
              <div className="badge-sticker bg-brand-yellow text-brand-yellow-foreground text-[9px] mb-2 inline-block">⚠️ New / Flagged</div>
              <div className="font-black text-sm leading-tight mb-1">{flagged.name}</div>
              <div className="text-xs text-foreground/70 space-y-0.5">
                {flagged.date && <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{flagged.date}</div>}
                {flagged.venue && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{flagged.venue}</div>}
                {flagged.neighborhood && <div>{flagged.neighborhood}</div>}
                <div className="text-[10px] text-foreground/40 mt-1">Source: {flagged.source}</div>
              </div>
            </div>

            {/* Original */}
            <div className="bg-brand-cream border-2 border-foreground/20 rounded-xl p-3">
              <div className="badge-sticker bg-foreground/10 text-[9px] mb-2 inline-block">📌 Existing Event</div>
              {original ? (
                <>
                  <div className="font-black text-sm leading-tight mb-1">{original.name}</div>
                  <div className="text-xs text-foreground/70 space-y-0.5">
                    {original.date && <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{original.date}</div>}
                    {original.venue && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{original.venue}</div>}
                    {original.neighborhood && <div>{original.neighborhood}</div>}
                    <div className="text-[10px] text-foreground/40 mt-1">Status: {original.workflowStatus}</div>
                  </div>
                </>
              ) : (
                <div className="text-xs text-foreground/50 italic">Original event not found</div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-foreground/10">
            <button
              type="button"
              disabled={processingId === flagged.id}
              onClick={() => resolve(flagged.id, "pending")}
              className="button-pop text-xs px-3 py-1.5 bg-brand-lime text-foreground inline-flex items-center gap-1 disabled:opacity-50"
            >
              {processingId === flagged.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              Not a Duplicate — Send to Review
            </button>
            <button
              type="button"
              disabled={processingId === flagged.id}
              onClick={() => resolve(flagged.id, "archived")}
              className="button-pop text-xs px-3 py-1.5 bg-foreground/10 text-foreground inline-flex items-center gap-1 disabled:opacity-50"
            >
              {processingId === flagged.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Archive className="w-3 h-3" />}
              Confirm Duplicate — Archive
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Bulk actions constant ─────────────────────────────────────────────────────

const BULK_ACTIONS = [
  { status: "approved",  label: "Approve",  icon: <CheckCircle className="w-3.5 h-3.5" />, cls: "bg-brand-lime text-foreground" },
  { status: "published", label: "Publish",  icon: <Eye className="w-3.5 h-3.5" />,         cls: "bg-brand-navy text-white" },
  { status: "rejected",  label: "Reject",   icon: <XCircle className="w-3.5 h-3.5" />,     cls: "bg-brand-red text-white" },
  { status: "archived",  label: "Archive",  icon: <Archive className="w-3.5 h-3.5" />,     cls: "bg-foreground/10 text-foreground" },
] as const;

type OpsTab = "events" | "sources" | "logs" | "duplicates" | "dashboard";

const OPS_TABS: { id: OpsTab; label: string; icon: React.ReactNode }[] = [
  { id: "events",     label: "Events",     icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: "sources",    label: "Sources",    icon: <RefreshCw className="w-3.5 h-3.5" /> },
  { id: "logs",       label: "Import Logs",icon: <FileText className="w-3.5 h-3.5" /> },
  { id: "duplicates", label: "Duplicates", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { id: "dashboard",  label: "Dashboard",  icon: <BarChart3 className="w-3.5 h-3.5" /> },
];

function EventsOpsPanel({ adminKey }: { adminKey: string }) {
  const qc = useQueryClient();
  const [opsTab, setOpsTab] = useState<OpsTab>("events");
  const [statusFilter, setStatusFilter] = useState<StatusTab>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [undoState, setUndoState] = useState<PriorStatusEntry[] | null>(null);
  const [undoPending, setUndoPending] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const [ingestSources, setIngestSources] = useState<EventSourceRecord[]>([]);

  useEffect(() => {
    listSources(adminKey).then(setIngestSources).catch(() => setIngestSources([]));
  }, [adminKey]);

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

  // Full filtered set (status filter applied server-side; source + search here)
  const events = useMemo(() => {
    let all = (eventsRaw as AdminEventRecord[] | undefined) ?? [];
    if (sourceFilter !== "all") {
      all = all.filter((e) =>
        e.ingestSourceId ? e.ingestSourceId === sourceFilter : e.source === sourceFilter,
      );
    }
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        (e.contactName ?? "").toLowerCase().includes(q) ||
        (e.contactEmail ?? "").toLowerCase().includes(q),
    );
  }, [eventsRaw, search, sourceFilter]);

  const allEvents = (eventsRaw as AdminEventRecord[] | undefined) ?? [];

  // Source filter options: ingest sources by name + manual source strings, with counts
  const sourceOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of allEvents) {
      const key = e.ingestSourceId ?? e.source;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const nameById = new Map(ingestSources.map((s) => [s.id, s.name]));
    const manualLabels: Record<string, string> = {
      web_form: "Web Form",
      csv_import: "CSV Import",
      manual: "Manual",
    };
    return [...counts.entries()]
      .map(([key, count]) => ({
        value: key,
        label: nameById.get(key) ?? manualLabels[key] ?? key,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [allEvents, ingestSources]);

  // Client-side pagination — keeps the DOM light with 1,500+ pending events
  const PAGE_SIZE = 50;
  const pageCount = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pagedEvents = useMemo(
    () => events.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [events, safePage],
  );

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: getListAdminEventsQueryKey() });
    void qc.invalidateQueries({ queryKey: getGetAdminEventsSummaryQueryKey() });
  }, [qc]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const visibleIds = pagedEvents.map((e) => e.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const allMatchingSelected = events.length > 0 && events.every((e) => selectedIds.has(e.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const selectAllMatching = () => {
    setSelectedIds(new Set(events.map((e) => e.id)));
  };

  // How long the Undo option stays available after a bulk action (ms)
  const UNDO_WINDOW_MS = 20000;

  const clearUndo = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setUndoState(null);
  }, []);

  useEffect(() => () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, []);

  const doBulkAction = async (status: string) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkPending(true);
    setBulkMsg(null);
    setBulkProgress(null);
    clearUndo();
    try {
      const result = await bulkUpdateStatusChunked(ids, status, adminKey, (done, total) =>
        setBulkProgress({ done: Math.min(done, total), total }),
      );
      setBulkMsg(`✅ ${result.updated} event${result.updated !== 1 ? "s" : ""} updated to "${status}".`);
      if (result.prior.length > 0) {
        setUndoState(result.prior);
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        undoTimerRef.current = setTimeout(() => {
          setUndoState(null);
          undoTimerRef.current = null;
        }, UNDO_WINDOW_MS);
      }
      setSelectedIds(new Set());
      refresh();
    } catch (err) {
      setBulkMsg(`❌ ${err instanceof Error ? err.message : "Bulk update failed"}`);
    } finally {
      setBulkPending(false);
      setBulkProgress(null);
    }
  };

  const doUndoBulkAction = async () => {
    if (!undoState || undoState.length === 0 || undoPending) return;
    const entries = undoState;
    setUndoPending(true);
    setBulkProgress(null);
    try {
      const result = await bulkRestoreStatusChunked(entries, adminKey, (done, total) =>
        setBulkProgress({ done: Math.min(done, total), total }),
      );
      setBulkMsg(`↩️ Undone — ${result.updated} event${result.updated !== 1 ? "s" : ""} restored to their previous status.`);
      clearUndo();
      refresh();
    } catch (err) {
      setBulkMsg(`❌ ${err instanceof Error ? err.message : "Undo failed"}`);
    } finally {
      setUndoPending(false);
      setBulkProgress(null);
    }
  };

  return (
    <div>
      {summary && <SummaryBar summary={summary} />}

      {/* Inner ops tab bar */}
      <div className="flex flex-wrap items-center gap-1.5 mb-5 border-b-2 border-foreground/10 pb-3">
        {OPS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setOpsTab(t.id)}
            className={`button-pop text-sm px-3 py-1.5 inline-flex items-center gap-1.5 ${opsTab === t.id ? "button-pop-yellow" : "bg-white text-foreground"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
        <div className="ml-auto">
          <NotificationsBell adminKey={adminKey} />
        </div>
      </div>

      {/* Ops dashboard panel */}
      {opsTab === "dashboard" && <OpsDashboardPanel adminKey={adminKey} />}

      {/* Sources panel */}
      {opsTab === "sources" && <SourcesPanel adminKey={adminKey} />}

      {/* Import logs panel */}
      {opsTab === "logs" && <ImportLogsPanel adminKey={adminKey} />}

      {/* Duplicates panel */}
      {opsTab === "duplicates" && <DuplicatesPanel adminKey={adminKey} onChanged={refresh} />}

      {/* Events panel (existing content) */}
      {opsTab === "events" && <>

      {/* CSV Importer */}
      {showImporter && (
        <CsvImporter
          adminKey={adminKey}
          existingEvents={allEvents}
          onDone={() => { refresh(); setStatusFilter("pending"); }}
          onClose={() => setShowImporter(false)}
        />
      )}

      {/* Top toolbar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { setStatusFilter(tab.id); setSelectedIds(new Set()); setPage(0); }}
            className={`button-pop text-sm px-3 py-1.5 ${statusFilter === tab.id ? "button-pop-yellow" : "bg-white text-foreground"}`}
          >
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          onClick={refresh}
          className="button-pop text-sm px-3 py-1.5 bg-white text-foreground inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
        <button
          type="button"
          onClick={() => setShowImporter((v) => !v)}
          className="button-pop text-sm px-3 py-1.5 bg-brand-cream text-foreground inline-flex items-center gap-1.5 ml-auto"
        >
          <Upload className="w-3.5 h-3.5" /> Import CSV
        </button>
      </div>

      {/* Search + source filter + select-all row */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedIds(new Set()); setPage(0); }}
            placeholder="Search by event name, venue, or contact…"
            className="w-full border-2 border-foreground rounded-lg pl-9 pr-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-yellow"
          />
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setSelectedIds(new Set()); setPage(0); }}
          className="border-2 border-foreground rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-yellow shrink-0 max-w-[240px]"
          aria-label="Filter by source"
        >
          <option value="all">All sources</option>
          {sourceOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label} ({o.count})
            </option>
          ))}
        </select>
        {pagedEvents.length > 0 && (
          <button
            type="button"
            onClick={toggleSelectAll}
            className="button-pop text-sm px-3 py-2 bg-white text-foreground inline-flex items-center gap-1.5 shrink-0"
          >
            {allVisibleSelected ? <CheckSquare className="w-4 h-4 text-brand-yellow" /> : <Square className="w-4 h-4" />}
            {allVisibleSelected ? "Deselect page" : "Select page"}
          </button>
        )}
      </div>

      {/* Select-all-matching banner: page selected but more matches exist */}
      {events.length > pagedEvents.length && allVisibleSelected && !allMatchingSelected && (
        <div className="card-pop bg-brand-yellow/20 border-2 border-brand-yellow p-3 mb-4 text-sm flex flex-wrap items-center gap-2">
          <span>All <strong>{visibleIds.filter((id) => selectedIds.has(id)).length}</strong> events on this page are selected.</span>
          <button
            type="button"
            onClick={selectAllMatching}
            className="font-black underline underline-offset-2 hover:no-underline"
          >
            Select all {events.length} matching events
          </button>
        </div>
      )}

      {/* Bulk result banner (shown after a bulk action, with a short undo window) */}
      {bulkMsg && selectedIds.size === 0 && (
        <div className="card-pop bg-white border-2 border-foreground p-3 mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold">{bulkMsg}</span>
          {undoState && undoState.length > 0 && (
            <button
              type="button"
              disabled={undoPending}
              onClick={() => void doUndoBulkAction()}
              className="button-pop text-xs px-2.5 py-1.5 inline-flex items-center gap-1 bg-brand-yellow text-foreground disabled:opacity-50"
            >
              {undoPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Undo
            </button>
          )}
          <button
            type="button"
            onClick={() => { setBulkMsg(null); clearUndo(); }}
            className="text-foreground/40 hover:text-foreground ml-auto"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          {undoPending && bulkProgress && (
            <div className="w-full text-xs font-bold pt-1 border-t border-foreground/20">
              Undoing… {bulkProgress.done} of {bulkProgress.total}
            </div>
          )}
        </div>
      )}

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="card-pop bg-brand-cream border-2 border-foreground p-3 mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-black">
            {selectedIds.size} selected
            {allMatchingSelected && events.length > pagedEvents.length ? " (all matching)" : ""}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {BULK_ACTIONS.map((a) => (
              <button
                key={a.status}
                type="button"
                disabled={bulkPending}
                onClick={() => doBulkAction(a.status)}
                className={`button-pop text-xs px-2.5 py-1.5 inline-flex items-center gap-1 disabled:opacity-50 ${a.cls}`}
              >
                {bulkPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : a.icon}
                {a.label}
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
          {bulkPending && bulkProgress && (
            <div className="w-full text-xs font-bold pt-1 border-t border-foreground/20">
              Processing… {bulkProgress.done} of {bulkProgress.total}
            </div>
          )}
          {bulkMsg && (
            <div className="w-full text-xs font-bold pt-1 border-t border-foreground/20">
              {bulkMsg}
            </div>
          )}
        </div>
      )}

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
        {pagedEvents.map((ev) => (
          <AdminEventCard
            key={ev.id}
            event={ev}
            adminKey={adminKey}
            onUpdated={refresh}
            selected={selectedIds.has(ev.id)}
            onSelect={() => toggleSelect(ev.id)}
          />
        ))}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            type="button"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
            className="button-pop text-sm px-3 py-1.5 bg-white text-foreground disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm font-bold">
            Page {safePage + 1} of {pageCount}
            <span className="text-foreground/50 font-normal"> · {events.length} events</span>
          </span>
          <button
            type="button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
            className="button-pop text-sm px-3 py-1.5 bg-white text-foreground disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
      </>}
    </div>
  );
}

// ── Main admin page ──────────────────────────────────────────────────────────

export default function AdminApplications() {
  const [unlocked, setUnlocked] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  // Keep the module-level actor identity fresh for all fetch helpers on this
  // page (bulk status updates, duplicate resolution, etc.).
  useAdminActor();

  useEffect(() => {
    if (sessionStorage.getItem(UNLOCK_KEY) === "1") {
      setUnlocked(true);
      setAdminKey(sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? ADMIN_PASSWORD);
    }
  }, []);

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

  return (
    <div className="min-h-screen bg-[hsl(var(--brand-cream))] texture-paper py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <AdminNav onLock={() => setUnlocked(false)} />
        <div className="mb-4">
          <h1
            className="text-3xl font-black"
            style={{ fontFamily: "Bungee, sans-serif" }}
          >
            Event Hub
          </h1>
          <p className="text-xs text-foreground/60 mt-1">
            Notifications send to <strong>touristpassportatl@gmail.com</strong>.
          </p>
        </div>
        <SyncFailureBanner adminKey={adminKey} />
        <EventsOpsPanel adminKey={adminKey} />
      </div>
    </div>
  );
}
