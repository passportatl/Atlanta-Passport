import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Upload,
  Download,
  FileText,
  CheckSquare,
  Square,
  Archive,
  X,
  Loader2,
  ArrowRight,
} from "lucide-react";
import AdminNav from "@/components/AdminNav";

// ── Typed helpers for the two new bulk endpoints ────────────────────────────

const API_BASE = "/api";

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

async function bulkUpdateStatus(
  ids: string[],
  status: string,
  adminKey: string,
): Promise<{ updated: number }> {
  const res = await fetch(`${API_BASE}/admin/events/bulk-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify({ ids, status }),
  });
  if (!res.ok) throw new Error(`Bulk update failed: ${res.status}`);
  return res.json() as Promise<{ updated: number }>;
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
            className="button-pop text-sm px-3 py-2 bg-brand-cream inline-flex items-center gap-2"
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
              className="button-pop text-sm px-3 py-2 bg-brand-cream"
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
                      className={`border-b border-foreground/10 last:border-0 ${hasError ? "bg-red-50" : willSkip ? "bg-yellow-50" : "bg-white"}`}
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
              className="button-pop text-sm px-3 py-2 bg-brand-cream"
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
              {selected ? (
                <CheckSquare className="w-4 h-4 text-brand-yellow" />
              ) : (
                <Square className="w-4 h-4" />
              )}
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

const BULK_ACTIONS = [
  { status: "approved",  label: "Approve",  icon: <CheckCircle className="w-3.5 h-3.5" />, cls: "bg-brand-lime text-foreground" },
  { status: "published", label: "Publish",  icon: <Eye className="w-3.5 h-3.5" />,         cls: "bg-brand-navy text-white" },
  { status: "rejected",  label: "Reject",   icon: <XCircle className="w-3.5 h-3.5" />,     cls: "bg-brand-red text-white" },
  { status: "archived",  label: "Archive",  icon: <Archive className="w-3.5 h-3.5" />,     cls: "bg-foreground/10 text-foreground" },
] as const;

function EventsOpsPanel({ adminKey }: { adminKey: string }) {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [showImporter, setShowImporter] = useState(false);

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

  const allEvents = (eventsRaw as AdminEventRecord[] | undefined) ?? [];

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

  const visibleIds = events.map((e) => e.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

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

  const doBulkAction = async (status: string) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkPending(true);
    setBulkMsg(null);
    try {
      const result = await bulkUpdateStatus(ids, status, adminKey);
      setBulkMsg(`✅ ${result.updated} event${result.updated !== 1 ? "s" : ""} updated to "${status}".`);
      setSelectedIds(new Set());
      refresh();
    } catch (err) {
      setBulkMsg(`❌ ${err instanceof Error ? err.message : "Bulk update failed"}`);
    } finally {
      setBulkPending(false);
    }
  };

  return (
    <div>
      {summary && <SummaryBar summary={summary} />}

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
            onClick={() => { setStatusFilter(tab.id); setSelectedIds(new Set()); }}
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
        <button
          type="button"
          onClick={() => setShowImporter((v) => !v)}
          className="button-pop text-sm px-3 py-1.5 bg-brand-cream inline-flex items-center gap-1.5 ml-auto"
        >
          <Upload className="w-3.5 h-3.5" /> Import CSV
        </button>
      </div>

      {/* Search + select-all row */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedIds(new Set()); }}
            placeholder="Search by event name, venue, or contact…"
            className="w-full border-2 border-foreground rounded-lg pl-9 pr-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-yellow"
          />
        </div>
        {events.length > 0 && (
          <button
            type="button"
            onClick={toggleSelectAll}
            className="button-pop text-sm px-3 py-2 bg-white inline-flex items-center gap-1.5 shrink-0"
          >
            {allVisibleSelected ? <CheckSquare className="w-4 h-4 text-brand-yellow" /> : <Square className="w-4 h-4" />}
            {allVisibleSelected ? "Deselect all" : "Select all"}
          </button>
        )}
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="card-pop bg-brand-cream border-2 border-foreground p-3 mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-black">
            {selectedIds.size} selected
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
        {events.map((ev) => (
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
