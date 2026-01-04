import { Router } from "express";
import { getAllWebsites, getwebsiteDetails, postwebsiteDetails } from "../../controllers/websiteControllers";
import { authMiddleware } from "../../middleware";
import type { Request, Response, NextFunction } from "express";
const router = Router();

router.get("/", authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getAllWebsites(req, res).catch(next);
});

router.post("/", authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  postwebsiteDetails(req, res).catch(next);
});

router.get("/:websiteId", authMiddleware, (req, res, next) => {
  getwebsiteDetails(req, res).catch(next);
});

export default router