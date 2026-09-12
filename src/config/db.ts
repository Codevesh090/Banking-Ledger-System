import mongoose from "mongoose";
import { MONGO_URI } from "./env.js";


export function connectToDb() {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not defined in environment variables");
  } //check karo MONGO_URI undefined toh nahi hai , agar hai toh error do.
  
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log("Server is connected to db");
    })
    .catch(error => {
      console.log("Server is failed connecting to db");
      process.exit(1);  //Matlab agar server db se connect nahi hota hai , toh server bhi band kar do .
    })
}

//Here, we just made a function which we call to connect db with our server .