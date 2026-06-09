---
name: Google Drive / Sheets export
description: Why signup export uses the google-drive connector + Drive CSV media-upload, not the google-sheet connector.
---

# Google Sheets export of signups

The Replit-managed **google-sheet** connector is **read-only** (`spreadsheets.readonly`, `drive.readonly`) — it 403s on any write ("insufficient authentication scopes"). The **google-drive** connector grants write scopes including `spreadsheets` + `drive.file`, so use it for anything that creates/updates Sheets.

**Why not call the Sheets API:** `ReplitConnectors.proxy("google-drive", ...)` only reaches the Drive API host (`www.googleapis.com/drive/v3`), not `sheets.googleapis.com`. The SDK's `listConnections()` does **not** expose the raw access token (settings are empty), so you can't bypass the proxy to hit the Sheets host directly.

**How to apply (the working pattern):** create a native Google Sheet via Drive (`POST /drive/v3/files` with `mimeType: application/vnd.google-apps.spreadsheet`), then rewrite its full contents with a CSV media upload (`PATCH /upload/drive/v3/files/{id}?uploadType=media`, `Content-Type: text/csv`) — Google converts the CSV into the Sheet. Always rewrite the whole table from the DB (source of truth) so the op is idempotent. Persist the file id (we use the `app_config` kv table) and only recreate the sheet on an explicit 404/trashed — treat 401/429/5xx as transient and throw so a retry doesn't orphan the sheet and create duplicates. Files created with `drive.file` scope land in the connected account's My Drive and are visible to that user.
