import { Router } from "express";
import { getwebsiteDetails, postwebsiteDetails } from "../../controllers/websiteControllers";
import { signIn, signUp } from "../../controllers/userControllers";
const router = Router();

router.post("/signin", (req,res, next)=>{
    signIn(req, res ).catch(next);
});

router.post("/signup", (req,res, next)=>{
    signUp(req, res ).catch(next);
});
// router.get("/status/:websiteId", getwebsiteDetails)


export default router