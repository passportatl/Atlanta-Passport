import { Router, type IRouter } from "express";
import healthRouter from "./health";
import visitorsRouter from "./visitors";
import businessesRouter from "./businesses";
import stampsRouter from "./stamps";
import applicationsRouter from "./applications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(visitorsRouter);
router.use(businessesRouter);
router.use(stampsRouter);
router.use(applicationsRouter);

export default router;
