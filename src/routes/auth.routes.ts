import express from "express";
import { userRegisterController, userLoginController } from "../controllers/auth.controller.js";
import { loginLimiter } from "../middlewares/rateLimiter.middleware.js";

export const authrouter = express.Router();


authrouter.post("/register", userRegisterController);
authrouter.post("/login",loginLimiter ,userLoginController);
authrouter.post("/logout", userLoginController);



