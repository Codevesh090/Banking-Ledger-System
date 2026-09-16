import { app } from "./app.js";
import { rateLimit } from "express-rate-limit"; //This package defaults to identifying clients by IP, and returns HTTP 429 when the limit is exceeded.
import { connectToDb } from "./config/db.js";
import { PORT } from "./config/env.js";




connectToDb(); //calling to connect our server with db

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 100, // 100 requests per IP address in 15 minutes 
  standardHeaders: "draft-8", // to tell users kitni requests remaining hai and kab limit reset hogi according to "draft-8" newer draft standard header format.Client ko rate-limit information standard HTTP headers mein dena.
  legacyHeaders: false, //Older/legacy rate-limit headers ko disable karta hai yaani purane format ke headers mat bhejo .
  message: {
      message: "Too many requests. Please try again later."
    }
})

// Yaani “Har client IP ko 15 minutes mein maximum 100 API requests allow karo. Agar limit cross ho jaye, request reject karo aur 429 response do.”






app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`)
})















// We will define and run the server through here.