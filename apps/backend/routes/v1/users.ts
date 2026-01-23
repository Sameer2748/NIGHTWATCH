import { Router } from "express";
import { getwebsiteDetails, postwebsiteDetails } from "../../controllers/websiteControllers";
import { signIn, signUp, getUserDetails, googleSignIn } from "../../controllers/userControllers";
import { authMiddleware } from "../../middleware";
const router = Router();

router.post("/signin", (req, res, next) => {
    signIn(req, res).catch(next);
});

router.post("/signup", (req, res, next) => {
    signUp(req, res).catch(next);
});

router.post("/google", (req, res, next) => {
    googleSignIn(req, res).catch(next);
});

router.get("/me", authMiddleware, (req, res, next) => {
    getUserDetails(req, res).catch(next);
});

export default router