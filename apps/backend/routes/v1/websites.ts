import { Router } from "express";
import { getwebsiteDetails, postwebsiteDetails } from "../../controllers/websiteControllers";
import { authMiddleware } from "../../middleware";
import type { Request, Response, NextFunction } from "express";
const router = Router();

router.post("/", authMiddleware, (req: Request, res: Response, next: NextFunction) => {
    postwebsiteDetails(req, res).catch(next);
});

router.get("/status/:websiteId", authMiddleware, (req, res, next) => {
  getwebsiteDetails(req, res).catch(next);
});

export default router