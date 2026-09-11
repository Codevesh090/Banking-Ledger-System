import express from "express";
import authrouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";

export const app = express();


app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authrouter);  










// Just created the instance of the server here .