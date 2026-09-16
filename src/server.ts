import { app } from "./app.js";
import { connectToDb } from "./config/db.js";
import { PORT } from "./config/env.js";


connectToDb(); //calling to connect our server with db


app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`)
})















// We will define and run the server through here.