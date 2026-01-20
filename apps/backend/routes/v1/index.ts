import { Router } from "express";
import WebsiteRouter from "./websites"
import UserRouter from "./users"
import StatusPageRouter from "./statusPages"
import { authMiddleware } from "../../middleware";
const router = Router()

router.use("/user", UserRouter)
router.use("/website", WebsiteRouter)
router.use("/status-page", StatusPageRouter)

export default router;