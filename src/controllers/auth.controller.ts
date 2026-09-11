import type{ Request,Response } from "express";
import { userModel } from "../models/user.model.js";
import jwt from "jsonwebtoken";

//signup route
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


