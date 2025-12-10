import { Router } from "express";
import WebsiteRouter from "./websites"
import UserRouter from "./users"
import { authMiddleware } from "../../middleware";
const router =  Router()

router.use("/user", UserRouter)
router.use("/website", WebsiteRouter)

export default router;