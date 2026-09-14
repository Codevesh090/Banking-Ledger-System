import type { Request, Response } from "express";
import { accountModel } from "../models/account.model.js";
import { transactionModel } from "../models/transaction.model.js";
import mongoose , {Types} from "mongoose";
import { ledgerModel } from "../models/ledger.model.js";
import { sendTransactionEmail } from "../services/email.service.js";


interface CustomRequest extends Request {
  user?: {
    _id: Types.ObjectId,
    email: string,
    name:string
  }
}


export async function createTransactionController(req:CustomRequest,res:Response):Promise<void> {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {  //Check  = client side se sab kuch aaya hai naa
    res.status(400).json({
      message: "fromAccount , toAccount , amount , idempotencyKey are required"
    });
    return;
  }

  const isFromAccountExists = await accountModel.findOne({ _id: fromAccount }); //checking these accounts exists in account table or not .

  const isToAccountExists = await accountModel.findOne({ _id: toAccount });

  if (!isFromAccountExists || !isToAccountExists) {
    res.status(400).json({
      message:"Invalid fromAccount or toAccount"
    });
    return;
  }



  
  const isTransactionExists = await transactionModel.findOne({ idempotencyKey })

  if (isTransactionExists) { //if exist = yes then we do this 
    if (isTransactionExists.status === "COMPLETED") {
      res.status(200).json({
        message: "Transaction already processed",
        transaction: isTransactionExists
      })
      return;
    };

    if (isTransactionExists.status === "PENDING") {
      res.status(200).json({
        message: "Transaction is still processing",
        transaction: isTransactionExists
      })
      return;
    }

    if (isTransactionExists.status === "FAILED") {
      res.status(500).json({
        message: "Transaction processing is failed previously , please retry",
      })
      return;
    }

    if (isTransactionExists.status === "REVERSED") {
      res.status(500).json({
        message: "Transaction is reversed or rollbacked , please retry",
      })
      return;
    }

  }


  
  if (isFromAccountExists.status !== "ACTIVE" || isToAccountExists.status !== "ACTIVE") {
    res.status(400).json({
      message: "Both fromAccount and toAccount must have to be active , to process transaction"
    });
    return;
  }



  
  const balance = await isFromAccountExists.getBalance(); //isFromAccountExist ek document contain karta hai account table ka and us document me .getbalance ek method bhi hai , That's why we are using it here .   Hamesha ek table me banaye gaye method uske hi documents par lagte hai only

  if (balance < amount) {    //If the senders(fromAccount) sending amount is less than the balance of that sender's(fromAccount) account . 
    res.status(400).json({
      message:`Insufficicent balance . Current balance is ${balance}. Requested amount is ${amount}`
    })
  }





  const session = await mongoose.startSession(); //We have to start the session to start the transaction
  session.startTransaction()

  // Operation:1 - Creating transaction
  const transaction = await transactionModel.create( // when we pass "two" arguments in .create() then always it is in this way [documentsArray, options] and also it returns an array whcih has this objet and not a object only like normally happens in "transaction"
    [
      {
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
      }
    ],
    {
      session
    }
  );

  if (!transaction[0]) {
    throw new Error("No transaction refrence exist, for ledger entry")
  }

  // Operation:2 - Creating Debit Ledger Entry yaani kitna amount kis account se debit hua , uska record in ledger
  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromAccount,
        amount: amount,
        transaction: transaction[0]._id,
        type:"DEBIT"
      }
    ],
    {
      session
    }
  )

  // Operation:3 - Creating Credit Ledger Entry yaani kitna amount kis account me credit hua , uska record in ledger
  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        amount: amount,
        transaction: transaction[0]._id,
        type:"CREDIT"
      }
    ],
    {
      session
    }
  )

  // Operation:4 Setting the transaction status to be "COMPLETED"
  transaction[0].status = "COMPLETED";
  await transaction[0].save({ session }); //? what does .save means here 

  await session.commitTransaction();
  session.endSession()   //Yaani agar ab hoga toh all 4 operations honge nahi toh koi bhi nahi hoga "rollback" ho jaayega.




  
  if (!req.user?.email || !req.user?.name) {
    throw new Error("User email or name is missing to sendTransactionEmail")
  }
  
  await sendTransactionEmail(req.user?.email , req.user?.name , amount, toAccount)
}





