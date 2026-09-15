import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { createAccountController } from "../controllers/account.controller.js";

export const accountrouter = express.Router();

// POST - /api/account/
accountrouter.post("/", authMiddleware, createAccountController);
