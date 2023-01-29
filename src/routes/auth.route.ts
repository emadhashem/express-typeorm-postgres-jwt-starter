import { Router } from "express";
import { loginUserHandler, logoutHandler, refreshAccessTokenHandler, registerUserHandler } from "../controllers/auth.controller";
import { deserializeUser } from "../middlewares/deserializeUser.middleware";
import { requiredUser } from "../middlewares/requiredUser.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createUserShcema, loginUserSchema } from "../schemas/user.schema";

const router = Router()

router.post('/register' , validate(createUserShcema) , registerUserHandler)
router.post('/login' , validate(loginUserSchema) , loginUserHandler)
router.get('/logout' , deserializeUser , requiredUser , logoutHandler)
router.get('/refresh' , refreshAccessTokenHandler)

export default router


