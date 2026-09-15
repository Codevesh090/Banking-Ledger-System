import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { createAccountController, getUserBalanceController } from "../controllers/account.controller.js";

export const accountrouter = express.Router();

// POST - /api/account/
accountrouter.post("/", authMiddleware, createAccountController);
// POST - /api/account/balance/vbdshvdsciusiucsuotuut22h
accountrouter.get("/balance/:accountId", authMiddleware, getUserBalanceController);
