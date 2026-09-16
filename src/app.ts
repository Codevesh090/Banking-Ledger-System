import express from "express";
import { authrouter } from "./routes/auth.routes.js";
import { accountrouter } from "./routes/account.routes.js";
import { transactionrouter } from "./routes/transaction.routes.js"; 
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit"; //This package defaults to identifying clients by IP, and returns HTTP 429 when the limit is exceeded.
import helmet from "helmet";

export const app = express();

app.set("trust proxy", 1); // The current flow is Client -> Render proxy -> Our express app  . So Render adds:X-Forwarded-For  which tell your application the original client’s IP. But express by default says trust proxy = false , so it cannot determine the client’s real IP. So, we set the trust proxy = true such that express trust on Render Proxy and take the client IP from Render proxy .
app.use(helmet()); //helmet is a security middleware for Express. It helps protect your API by setting various HTTP security headers.
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Ledger Service is up and running")
})

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 100, // 100 requests per IP address in 15 minutes 
  standardHeaders: "draft-8", // to tell users kitni requests remaining hai and kab limit reset hogi according to "draft-8" newer draft standard header format.Client ko rate-limit information standard HTTP headers mein dena.
  legacyHeaders: false, //Older/legacy rate-limit headers ko disable karta hai yaani purane format ke headers mat bhejo .
  message: {
      message: "Too many requests. Please try again later."
    }
    // Yaani “Har client IP ko 15 minutes mein maximum 100 API requests allow karo. Agar limit cross ho jaye, request reject karo aur 429 response do.”
}) 

app.use("/api", apiLimiter);

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