---
name: Large PDF / oversized attachments
description: How to use uploaded PDFs (esp. >50MB) that the read tool refuses to open.
---

When a user attaches a PDF that errors with "file size exceeds maximum allowed
size of 50MB" in the read tool, the file is still saved to `attached_assets/`.

**How to apply:**
- `pdfinfo <file>` for page count / page size.
- `pdftoppm -f 1 -l 1 -r 150 -png <file> /tmp/out` to render a page to PNG
  (raise `-r` for higher DPI). `magick`/`convert` are available to resize/strip
  and re-encode to a web-friendly JPG (e.g. `-resize 820x -quality 88`) before
  saving into an artifact's `src/assets/images/`.
- Prefer JPG for full-bleed photographic covers (much smaller than PNG); use PNG
  only when transparency is needed.
