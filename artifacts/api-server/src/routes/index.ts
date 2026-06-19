import { Router, type IRouter } from "express";
import healthRouter from "./health";
import visitorsRouter from "./visitors";
import businessesRouter from "./businesses";
import stampsRouter from "./stamps";
import redemptionsRouter from "./redemptions";
import applicationsRouter from "./applications";
import contactRouter from "./contact";
import adminExportRouter from "./admin-export";

const router: IRouter = Router();

router.use(healthRouter);
router.use(visitorsRouter);
router.use(businessesRouter);
router.use(stampsRouter);
router.use(redemptionsRouter);
router.use(applicationsRouter);
router.use(contactRouter);
router.use(adminExportRouter);

export default router;
