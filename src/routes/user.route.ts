import { Router } from "express";
import { getMeHandler } from "../controllers/user.controller";
import { deserializeUser } from "../middlewares/deserializeUser.middleware";
import { requiredUser } from "../middlewares/requiredUser.middleware";

const router = Router()
router.use(deserializeUser , requiredUser)
router.get('/me' , getMeHandler)

export default router