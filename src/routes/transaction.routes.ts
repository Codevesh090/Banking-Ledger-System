import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { createAccountController } from "../controllers/account.controller.js";

export const transactionrouter = express.Router();

transactionrouter.post("/",authMiddleware,createAccountController)
