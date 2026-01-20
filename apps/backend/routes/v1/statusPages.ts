import { Router } from "express";
import { authMiddleware } from "../../middleware";
import {
    createStatusPage,
    deleteStatusPage,
    getStatusPageDetails,
    getStatusPages,
    getPublicStatusPage
} from "../../controllers/statusPageController";

const router = Router();

// Public route (no auth required)
router.get("/public/:slug", getPublicStatusPage);

// Protected routes
router.post("/", authMiddleware, createStatusPage);
router.get("/", authMiddleware, getStatusPages);
router.get("/:id", authMiddleware, getStatusPageDetails);
router.delete("/:id", authMiddleware, deleteStatusPage);

export default router;
