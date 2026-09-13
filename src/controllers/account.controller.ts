import { accountModel } from "../models/account.model.js";
import type { Request, Response } from "express";
import { Types } from "mongoose";

interface CustomRequest extends Request{
  user?: {
    _id: Types.ObjectId,
    email: string,
    name:string
  }
}

export async function createAccountController(req:CustomRequest,res:Response) {
  const user = req.user;

  if (!user) {
    res.status(401).json({
      message: "User not authenticated"
    });
    return;
  }
  
  const account = await accountModel.create({
    userId:user._id
  })

  res.status(201).json({
    account
  })
  
}