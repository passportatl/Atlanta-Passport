import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { resolvePartnerSession } from "../lib/partner-auth";

const router: IRouter = Router();

router.get("/partner/session", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const session = await resolvePartnerSession(req);
  if (!session) {
    res.status(403).json({ error: "Active partner access required" });
    return;
  }

  res.json({
    account: {
      id: session.account.id,
      primaryEmail: session.account.primaryEmail,
      displayName: session.account.displayName,
      status: session.account.status,
    },
    memberships: session.memberships,
  });
});

export default router;
