import express from "express";
import authrouter from "./routes/auth.routes.js";
import accountrouter from "./routes/account.routes.js";
import cookieParser from "cookie-parser";

export const app = express();


app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authrouter); 
app.use("/api/account", accountrouter);  





// Just created the instance of the server here .