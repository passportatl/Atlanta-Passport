// QR-code Excel export to Google Drive.
//
// Builds an .xlsx workbook with one row per scannable QR: the sponsor offers
// (businesses with geofence coords) + all active bonus events (category
// "events") plus the 5 prize-tier redemption QRs. Uploads the file
// to the connected Google Drive account, overwriting the same file on each run
// (id tracked in app_config) so re-exports never pile up duplicates.
import ExcelJS from "exceljs";
import QRCode from "qrcode";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { isNotNull, eq, or } from "drizzle-orm";
import { db, businessesTable, appConfigTable } from "@workspace/db";
import { logger } from "./logger";

const FILE_NAME = "Summer 2026 passport qr codes";
const CONFIG_KEY = "qr_export_file_id";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Prize-tier stamp costs — mirror of PRIZE_TIERS thresholds on the client and of
// PRIZE_TIER_STAMPS in routes/redemptions.ts.
const PRIZE_TIER_STAMPS = [3, 7, 10, 13, 15];

const connectors = new ReplitConnectors();

function drive(
  path: string,
  options?: { method?: string; headers?: Record<string, string>; body?: string | Buffer },
): Promise<Response> {
  return connectors.proxy("google-drive", path, options);
}

async function getStoredFileId(): Promise<string | null> {
  const rows = await db
    .select()
    .from(appConfigTable)
    .where(eq(appConfigTable.key, CONFIG_KEY));
  return rows[0]?.value ?? null;
}

async function storeFileId(id: string): Promise<void> {
  await db
    .insert(appConfigTable)
    .values({ key: CONFIG_KEY, value: id })
    .onConflictDoUpdate({
      target: appConfigTable.key,
      set: { value: id, updatedAt: new Date() },
    });
}

async function fileExists(id: string): Promise<boolean> {
  const res = await drive(`/drive/v3/files/${id}?fields=id,trashed`);
  if (res.status === 404) return false;
  if (!res.ok) {
    throw new Error(`Drive lookup failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { trashed?: boolean };
  return json.trashed !== true;
}

async function createFile(): Promise<string> {
  const res = await drive("/drive/v3/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: FILE_NAME, mimeType: XLSX_MIME }),
  });
  if (!res.ok) {
    throw new Error(`Drive create failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { id?: string };
  if (!json.id) throw new Error("Drive create returned no file id");
  return json.id;
}

async function ensureFileId(): Promise<string> {
  const stored = await getStoredFileId();
  if (stored && (await fileExists(stored))) return stored;
  const id = await createFile();
  await storeFileId(id);
  logger.info({ id }, "Created Google Drive file for QR export");
  return id;
}

interface ExportRow {
  label: string;
  type: string;
  url: string;
}

function stampUrl(origin: string, slug: string): string {
  // Base path for the atlanta-passport artifact is "/" (see artifact.toml), so
  // stamp pages live at {origin}/stamp/{slug}.
  return `${origin}/stamp/${slug}`;
}

function redeemUrl(origin: string, tier: number): string {
  return `${origin}/redeem/${tier}`;
}

async function buildRows(origin: string): Promise<ExportRow[]> {
  // In scope: sponsor offers (geofence coords) plus ALL bonus events
  // (category "events") — CMS-created bonus stamps have no coords, so they
  // must be included by category, not by coordinates.
  const inScope = await db
    .select()
    .from(businessesTable)
    .where(or(isNotNull(businessesTable.latitude), eq(businessesTable.category, "events")));

  const businessRows: ExportRow[] = inScope
    .filter((b) => b.isActive)
    .map((b) => ({
      label: b.name,
      type: b.category === "events" ? "Bonus Event" : "Sponsor Offer",
      url: stampUrl(origin, b.slug),
    }))
    .sort((a, b) => a.type.localeCompare(b.type) || a.label.localeCompare(b.label));

  const prizeRows: ExportRow[] = PRIZE_TIER_STAMPS.map((tier) => ({
    label: `Prize Tier — ${tier} stamps`,
    type: "Prize Redemption",
    url: redeemUrl(origin, tier),
  }));

  return [...businessRows, ...prizeRows];
}

// The workbook is laid out as three clearly labeled sections, in order:
// Sponsor Offers, Bonus Events, then Prize Redemption Codes. Each section gets a
// bold merged title row before its rows.
const SECTIONS: { title: string; type: string }[] = [
  { title: "Sponsor Offers", type: "Sponsor Offer" },
  { title: "Bonus Events", type: "Bonus Event" },
  { title: "Prize Redemption Codes", type: "Prize Redemption" },
];

async function buildWorkbook(rows: ExportRow[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Atlanta Passport";
  wb.created = new Date();
  const ws = wb.addWorksheet("QR Codes");

  ws.columns = [
    { header: "Name", key: "label", width: 34 },
    { header: "Type", key: "type", width: 20 },
    { header: "URL", key: "url", width: 60 },
    { header: "QR Code", key: "qr", width: 22 },
  ];
  ws.getRow(1).font = { bold: true };

  for (const section of SECTIONS) {
    const sectionRows = rows.filter((r) => r.type === section.type);
    if (sectionRows.length === 0) continue;

    // Bold merged section header spanning all four columns.
    const headerRow = ws.addRow([section.title]);
    ws.mergeCells(`A${headerRow.number}:D${headerRow.number}`);
    headerRow.font = { bold: true, size: 13 };
    headerRow.alignment = { vertical: "middle" };
    headerRow.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFE680" },
    };

    for (const row of sectionRows) {
      const excelRow = ws.addRow({
        label: row.label,
        type: row.type,
        url: row.url,
      });
      excelRow.height = 130;
      excelRow.alignment = { vertical: "middle", wrapText: true };

      const dataUrl = await QRCode.toDataURL(row.url, { margin: 1, width: 256 });
      const base64 = dataUrl.split(",")[1] ?? "";
      const imageId = wb.addImage({ base64, extension: "png" });
      // Column index 3 (0-based) = "QR Code"; row index is excelRow.number - 1.
      ws.addImage(imageId, {
        tl: { col: 3.1, row: excelRow.number - 1 + 0.1 },
        ext: { width: 120, height: 120 },
      });
    }
  }

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadWorkbook(id: string, buffer: Buffer): Promise<void> {
  const res = await drive(`/upload/drive/v3/files/${id}?uploadType=media`, {
    method: "PATCH",
    headers: { "Content-Type": XLSX_MIME },
    body: buffer,
  });
  if (!res.ok) {
    throw new Error(`Drive media update failed: ${res.status} ${await res.text()}`);
  }
}

export async function exportQrWorkbook(
  publishedOrigin: string,
): Promise<{ url: string; fileName: string }> {
  const origin = publishedOrigin.replace(/\/$/, "");
  const rows = await buildRows(origin);
  const buffer = await buildWorkbook(rows);
  const id = await ensureFileId();
  await uploadWorkbook(id, buffer);
  logger.info({ id, rows: rows.length }, "Exported QR workbook to Google Drive");
  return {
    url: `https://drive.google.com/file/d/${id}/view`,
    fileName: FILE_NAME,
  };
}
