import express from "express";
import { authrouter } from "./routes/auth.routes.js";
import { accountrouter } from "./routes/account.routes.js";
import { transactionrouter } from "./routes/transaction.routes.js";
import cookieParser from "cookie-parser";

export const app = express();


app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Ledger Service is up and running")
})

app.use("/api/auth", authrouter); 
app.use("/api/account", accountrouter); 
app.use("/api/transaction", transactionrouter);  





// In this application, what we created :------------------------------------------------------------------------
// Register/Signup  ->    at /api/auth/register
// Login System     ->    at /api/auth/login
// Create account   ->    at /api/account/
// Can Send money from User A to User B      ->   at /api/transaction/
// Admin can send money to any User account or can send Initial funds in account    ->    at api/transaction/system/initial-funds
// Check balance of any account   ->    at  /api/account/balance/:accountId
// Logout System   ->    at  /api/auth/logout