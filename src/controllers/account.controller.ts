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


export async function getUserBalanceController(req:CustomRequest,res:Response) {
  try {
    const { accountId } = req.params;

    if (!req.user) {
      res.status(400).json({
        message: "User details not found"
      });
      return;
    }

    const account = await accountModel.findOne({
      _id: accountId,
      userId: req.user._id
    });

    if (!account) {
      res.status(400).json({
        message: "Account not found"
      });
      return;
    }

    const balance = await account.getBalance();

    res.status(200).json({
      accountId: account._id,
      balance: balance
    })
  } catch (err) {
    res.status(500).json({
      message:"Internal server error . Failed to fetch account balance"
    })
  }

  
}