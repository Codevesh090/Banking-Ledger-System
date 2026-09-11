import mongoose from "mongoose";
import bcrypt from "bcrypt";

//Schema - validates before putting anything in db
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required for creating user"],
    trim: true, //means automatically remove extra spaces from the beginning and end of a string. Only return pure email.
    lowercase: true, //means convert a string to lowercase before storing it.
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,"Invalid email address"], //Matlab given email ka format is type ka hai naa .
    unique:[true,"Email already exists"]
  },
  name: {
    type: String,
    required: [true,"Name is required for creating user"]
  },
  password: {
    type: String,
    required: [true, "Password is required for creating user"],
    minlength: [6, "password should contain more than 6 characters"],
    select:false //matlab agar hum is table me query kar toh jab tak hum password naa maange tab tak nahi aana chahiye , by default false rehna chahiye , jab specifically maange tabhi aaye .
  },  
}, {
  timestamps:true //yaani apne aap har document(yaani row) me createdAt and updatedAt ke do columns lag jaayegne.
})

//middleware when user forgot password , login , signup
userSchema.pre("save", async function (){   //Yeh function chalta hai after validation . Like user inputs -> then validation happens of everything before putting into db -> then when validation pass -> then before saving this middleware runs and converts that validated password into hash and then saves .
  if (!this.isModified("password")) { //agar password modified nahi hai ,user ne same password diya hai like last time toh kuch mat karo save kar do .
    return;
  } 

  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
})

//function used when user try to login
userSchema.methods.comparePassword = async function (password:string) {
  return await bcrypt.compare(password, this.password);
}


export const userModel = mongoose.model("user",userSchema)