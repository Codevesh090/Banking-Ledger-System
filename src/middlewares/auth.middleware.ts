import type{ Request,Response,NextFunction } from "express";
import { userModel } from "../models/user.model.js";
import { SECRET_KEY } from "../config/env.js";
import jwt from "jsonwebtoken";
import {Types} from "mongoose";



interface CustomRequest extends Request {
  user?: {
    _id: Types.ObjectId,
    email: string,
    name: string,
    systemUser?:boolean    //Jispar bhi ? yeh question mark lagate hai uska matlab ki wo field ho bhi sakti hai and nahi bhi .
  }
}


export async function authMiddleware(req:CustomRequest,res:Response,next:NextFunction):Promise<void> {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1]; //token cookie me ho toh waha se le lo , else headers me dekh lo.

  if (!token) {
    res.status(401).json({
      message: "Unauthorized access,token is missing"
    });
    return;
  } 

  try {
    
    if (!SECRET_KEY) {
      throw new Error("Invalid Secret Key");
    }
    
    const decoded = jwt.verify(token, SECRET_KEY);
    
    if (typeof decoded == "string") {
      throw new Error ("Invalid token payload")
    };
    
    const user = await userModel.findById(decoded.userId);

    if (!user) {
      throw new Error("User not found");
    }
    
    req.user = {
      _id: user._id,
      email: user.email,
      name: user.name
    }; //only taking this object in "user" key.

    next();
    
  } catch (error) {
    res.status(401).json({
      message: "Unauthorized access, token is invalid"
    });
    return;
  }
 
}






export async function authSystemUserMiddleware(req:CustomRequest,res:Response,next:NextFunction):Promise<void>{
  const token = await req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({
      message: "Unauthorized access,token is missing"
    });
    return;
  }

  try {

    if (!SECRET_KEY) {
      throw new Error("Invalid Secret Key");
    }
    
    const decoded = jwt.verify(token, SECRET_KEY);

    if (typeof decoded == "string") {
      throw new Error ("Invalid token payload")
    };
    
    const user = await userModel.findById(decoded.userId).select("+systemUser");

    if (!user) {
      throw new Error("User not found");
    }
    
    req.user = {
      _id: user._id,
      email: user.email,
      name: user.name,
      systemUser:user.systemUser
    }; 

    next()
  } catch (err) {
    res.status(401).json({
      message: "Unauthorized access, token is invalid"
    });
    return;
  }
  
}