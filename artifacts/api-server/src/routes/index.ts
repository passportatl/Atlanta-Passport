import { Router, type IRouter } from "express";
import healthRouter from "./health";
import visitorsRouter from "./visitors";
import businessesRouter from "./businesses";
import stampsRouter from "./stamps";
import redemptionsRouter from "./redemptions";
import applicationsRouter from "./applications";
import eventsRouter from "./events";
import contactRouter from "./contact";
import adminExportRouter from "./admin-export";
import sourcesRouter from "./sources";
import locationSubmissionsRouter from "./location-submissions";
import routesRouter from "./routes";
import snapshotImportRouter from "./snapshot-import";

const router: IRouter = Router();

router.use(healthRouter);
router.use(visitorsRouter);
router.use(businessesRouter);
router.use(stampsRouter);
router.use(redemptionsRouter);
router.use(applicationsRouter);
router.use(eventsRouter);
router.use(contactRouter);
router.use(adminExportRouter);
router.use(sourcesRouter);
router.use(locationSubmissionsRouter);
router.use(routesRouter);
router.use(snapshotImportRouter);

export default router;
