import { Router } from "express";
import { authMiddleware } from "../../middleware";
import { getIncidentDetails, getIncidents, acknowledgeIncident } from "../../controllers/incidentController";

const router = Router();

router.get("/", authMiddleware, getIncidents);
router.get("/:id", authMiddleware, getIncidentDetails);
router.post("/:id/acknowledge", authMiddleware, acknowledgeIncident);

export default router;
