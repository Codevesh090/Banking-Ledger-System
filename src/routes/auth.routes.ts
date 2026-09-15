import express from "express";
import { userRegisterController,userLoginController} from "../controllers/auth.controller.js";


export const authrouter = express.Router();


authrouter.post("/register", userRegisterController);
authrouter.post("/login", userLoginController);
authrouter.post("/logout", userLoginController);

