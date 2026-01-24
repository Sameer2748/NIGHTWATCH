import { Router } from "express";
import { handleHeartbeat } from "../../controllers/heartbeatController";

const router = Router();

// Public endpoint for heartbeats
router.get("/:monitorId", (req, res, next) => {
    handleHeartbeat(req, res).catch(next);
});

router.post("/:monitorId", (req, res, next) => {
    handleHeartbeat(req, res).catch(next);
});

export default router;
