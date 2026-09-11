import { app } from "./app.js";
import dotenv from "dotenv"; //Through this package we can seprate our .env secrets going to github.This package reads the .env and puts its content in process.env which protects our secrets to go out .
import { connectToDb } from "./config/db.js";

dotenv.config(); //Find the .env file, read the variables inside it, and put them into process.env.Now we can use "process.env"
const PORT = process.env.PORT;

connectToDb(); //calling to connect our server with db

app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`)
})















// We will define and run the server through here.