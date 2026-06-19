import { Router, type IRouter } from "express";
import { ExportQrCodesBody } from "@workspace/api-zod";
import { exportQrWorkbook } from "../lib/qrExport";

const router: IRouter = Router();

router.post("/admin/export-qr", async (req, res) => {
  const parsed = ExportQrCodesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", issues: parsed.error.issues });
    return;
  }
  try {
    const result = await exportQrWorkbook(parsed.data.publishedOrigin);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "QR export failed");
    res.status(500).json({ error: "Export failed" });
  }
});

export default router;
