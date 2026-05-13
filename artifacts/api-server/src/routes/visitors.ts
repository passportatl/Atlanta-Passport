import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, visitorsTable } from "@workspace/db";
import { CreateVisitorBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/visitors", async (req, res) => {
  const parsed = CreateVisitorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", issues: parsed.error.issues });
    return;
  }
  const { firstName, email, phone } = parsed.data;
  const [visitor] = await db
    .insert(visitorsTable)
    .values({ firstName, email, phone: phone ?? null })
    .returning();
  res.json(visitor);
});

router.get("/visitors/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }
  const rows = await db.select().from(visitorsTable).where(eq(visitorsTable.id, id));
  const visitor = rows[0];
  if (!visitor) {
    res.status(404).json({ error: "Visitor not found" });
    return;
  }
  res.json(visitor);
});

export default router;
