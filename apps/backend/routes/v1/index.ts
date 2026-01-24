import { Router } from "express";
import WebsiteRouter from "./websites"
import UserRouter from "./users"
import StatusPageRouter from "./statusPages"
import HeartbeatRouter from "./heartbeat"
import { authMiddleware } from "../../middleware";
const router = Router()

router.use("/user", UserRouter)
router.use("/website", WebsiteRouter)
router.use("/status-page", StatusPageRouter)
router.use("/heartbeat", HeartbeatRouter)

export default router;