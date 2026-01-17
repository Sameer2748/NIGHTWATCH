import { Router } from "express";
import { getAllWebsites, getwebsiteDetails, postwebsiteDetails, acknowledgeIncident, sendTestAlert, deleteWebsite } from "../../controllers/websiteControllers";
import { authMiddleware } from "../../middleware";
import type { Request, Response, NextFunction } from "express";
const router = Router();

router.get("/", authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getAllWebsites(req, res).catch(next);
});

router.post("/", authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  postwebsiteDetails(req, res).catch(next);
});

router.post("/incident/:incidentId/acknowledge", authMiddleware, (req, res, next) => {
  acknowledgeIncident(req, res).catch(next);
});

router.get("/:websiteId", authMiddleware, (req, res, next) => {
  getwebsiteDetails(req, res).catch(next);
});

router.delete("/:websiteId", authMiddleware, (req, res, next) => {
  deleteWebsite(req, res).catch(next);
});

router.post("/:websiteId/test-alert", authMiddleware, (req, res, next) => {
  sendTestAlert(req, res).catch(next);
});

export default router