import type{ Request,Response } from "express";
import { userModel } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

//signup route at /api/auth/register
export async function userRegisterController(req:Request,res:Response) {        
  const { email, password, name } = req.body;
  const isExists = await userModel.findOne({
    email: email
  });

  if (isExists) {
    return res.status(422).json({
      message: "User already exists with this email",
      status:"failed"
    })
  };

  const user = await userModel.create({
    email, password, name
  });

  if (!process.env.SECRET_KEY) {
    throw new Error("Invalid Secret Key");
  };
  const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: "3d" });

  res.cookie("token", token);

  res.status(201).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name
    },
    token
  });
  
}



//login route at /api/auth/login
export async function userLoginController(req:Request,res:Response) {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email }).select("+password"); //Kyuki humne password me select = true kiya hai toh jab tak alag se nahi mangenge tab tak password nahi aayega .

  if (!user) {
    return res.status(401).json({
      message:"Email or Password is Invalid"
    })
  };

  const validPassword = await user.comparePassword(password); //we are calling the method of the document which came in "user" when we asked .

  if (!validPassword) {
    return res.status(401).json({
      message:"Email or Password is Invalid"
    })
  };

  if (!process.env.SECRET_KEY) {
    throw new Error("Invalid Secret Key");
  };
  
  const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY);

  res.cookie("token", token);

  res.status(200).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name
    },
    token
  })

}
