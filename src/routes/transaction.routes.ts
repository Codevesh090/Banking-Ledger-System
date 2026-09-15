import express from "express";
import { authMiddleware, authSystemUserMiddleware } from "../middlewares/auth.middleware.js";
import { createInitialFundsTransactionController, createTransactionController } from "../controllers/transaction.controller.js";

export const transactionrouter = express.Router();


// -POST /api/transaction/
transactionrouter.post("/", authMiddleware, createTransactionController);

// -POST /api/transaction/system/initial-funds . Yeh api humne create ki hai for SystemUser yaani admin such that admin , ek user ke account me paisa daal sake yaa initial fund yaani 1st amount daal sake .
transactionrouter.post("/system/initial-funds", authSystemUserMiddleware, createInitialFundsTransactionController);