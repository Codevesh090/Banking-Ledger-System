import type { Request, Response } from "express";
import { accountModel } from "../models/account.model.js";
import { transactionModel } from "../models/transaction.model.js";
import mongoose , {Types} from "mongoose";
import { ledgerModel } from "../models/ledger.model.js";
import { sendTransactionEmail ,sendTransactionFailedEmail } from "../services/email.service.js";


interface CustomRequest extends Request {
  user?: {
    _id: Types.ObjectId,
    email: string,
    name:string
  }
}


export async function createTransactionController(req: CustomRequest, res: Response): Promise<void> {

  //1. When user choose who to send and put the amount and put the pin and then clicking Pay . Then a request gets created and we are just validating the request and client status that we are getting.

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



   //2. Uske baad hum check kar rahe hai , ki kya wo request already exist karti hai using idempotency key to prevent transaction duplication , hamare transaction table me. Like sometimes User clicked pay and request gone but any response didn't came to client for a long time toh client ko lagta hai ki shayad transaction fail ho gayi toh wo screen par loading sikhata hai and thodi-thodi der me khud se request bhejta rehta hai . 
  const isTransactionExists = await transactionModel.findOne({ idempotencyKey }) //It find ki kya koi transaction request already exist karta hai is key se apne transaction db me and if yes then it rejects all other requests with that same idempotency key to prevent duplicate transaction .

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


  //3. Checking that senders account and recievers account both are active or not .
  if (isFromAccountExists.status !== "ACTIVE" || isToAccountExists.status !== "ACTIVE") {
    res.status(400).json({
      message: "Both fromAccount and toAccount must have to be active , to process transaction"
    });
    return;
  }



    //4. Checking that sender have the approciate balance or not .
  const balance = await isFromAccountExists.getBalance(); //isFromAccountExist ek document contain karta hai account table ka and us document me .getbalance ek method bhi hai , That's why we are using it here .   Hamesha ek table me banaye gaye method uske hi documents par lagte hai only

  if (balance < amount) {    //If the senders(fromAccount) sending amount is less than the balance of that sender's(fromAccount) account . 
    res.status(400).json({
      message:`Insufficicent balance . Current balance is ${balance}. Requested amount is ${amount}`
    })
    return;
  }




  //5. Making the transaction happen with putting record in the ledger and sending mail to the user .
  const session = await mongoose.startSession(); //"MongoDB, ek session bana do and give the control of that session in "session" variable " . 
  try {
    session.startTransaction() // "Is session ke andar ek transaction start karo."

    // Operation:1 - Creating transaction with state "PENDING"
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
        session //This tell that yeh operation is session ke transaction ke andar aata hai . Like it is a tag which we apply on operations to tell that this operation comes under transaction .
      }
    );

    if (!transaction[0]) { //Kya transaction create hone ke baad mujhe transaction document mila?
      throw new Error("No transaction refrence exist, for ledger entry")
    }

    
    // Operation:2 - Creating Debit Ledger Entry yaani kitna amount kis account se debit hua , uska record in ledger.
    const debitLedgerEntry = await ledgerModel.create(
      [
        {
          account: fromAccount,
          amount: amount,
          transaction: transaction[0]._id,
          type: "DEBIT"
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
          type: "CREDIT"
        }
      ],
      {
        session
      }
    )

    
    // Operation:4 Setting the transaction status to be "COMPLETED"
    transaction[0].status = "COMPLETED"; //Transaction ko COMPLETED mark karo locally at code level and then 
    await transaction[0].save({ session }); //is change ko isi transaction mein save karo at Mongo level"

    await session.commitTransaction(); //"Agar sab kuch successful hai,to poore transaction ko COMMIT karo and the transaction success email"

    if (!req.user?.email || !req.user?.name) {
      throw new Error("User email or name is missing to sendTransactionEmail")
    }
    
    await sendTransactionEmail(req.user?.email , req.user?.name , amount, toAccount) // Because we are using this {session} here, it does not comes under transaction , its just the code that runs after .save()
  } catch (error) {
    // If Something failed → rollback everything and send the transaction failed email 
    await session.abortTransaction();

    if (!req.user?.email || !req.user?.name) {
      throw new Error("User email or name is missing to sendTransactionEmail")
    }
    
    await sendTransactionFailedEmail(req.user?.email, req.user?.name, amount, toAccount)
    
    throw error;
  } finally {
    session.endSession()   //Always close the session .
  };

}



// For admin transactions or System User transactions . Matlab humne transaction system ADMIN ke liye bhi bana diya such that admin ko agar kisi user ke account me paisa daalna ho toh wo daal sake .
export async function createInitialFundsTransactionController(req:CustomRequest,res:Response):Promise<void> {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    res.status(400).json({
      message: "toAccount, amount and idempotencyKey are required"
    })
  }

  if (!req.user?._id) {
    res.status(400).json({
      message:"Invalid user"
    });
    return;
  }

  const isFromAccountexists = await accountModel.findOne({ userId: req.user._id });

  if (!isFromAccountexists) {
    res.status(400).json({
      message: "System user account not found"
    });
    return;
  }
  

  const isToAccountexists = await accountModel.findOne({ _id: toAccount });

  if (!isToAccountexists) {
    res.status(400).json({
      message: "Invalid toAccount"
    });
    return;
  }


  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = await transactionModel.create(
      {
        fromAccount:isFromAccountexists._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
      }
  )

  if (!transaction) { //Kya transaction create hone ke baad mujhe transaction document mila?
    throw new Error("No transaction refrence exist, for ledger entry")
  }

  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: isFromAccountexists._id ,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
      }
    ],
    {
      session
    }
  )

  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
      }
    ],
    {
      session
    }
  )

  transaction.status = "COMPLETED";
  await transaction.save({ session });

  await session.commitTransaction();

  session.endSession()
  
  res.status(201).json({
    message: "Initial funds transaction completed successfully",
    transaction: transaction
  })

  return;

}







































//------------------------------------------------------------------------------------------------------------/-----

// How transactions work ?
//Toh kya hoga ki jab hum MongoDB mein koi query karte hain — jaise add, update ya delete — aur woh transaction ke bahar hoti hai, toh MongoDB us operation ko normally execute karke commit kar deta hai, aur change database mein directly visible ho jaata hai. Lekin jab hum transaction ke andar query karte hain, toh MongoDB har operation ko usi transaction ke context mein perform karta hai. Yeh operations MongoDB tak pahunchte hain aur execute bhi hote hain, lekin abhi woh transaction ke bahar final committed database state ka part nahi bante. MongoDB un changes ko transaction ke andar maintain karta hai. Phir jab transaction ke saare operations successfully complete ho jaate hain, toh hum commitTransaction() karte hain. Iske baad MongoDB transaction ke andar ki saari changes ko atomically commit kar deta hai, aur woh final database state mein visible ho jaati hain. Agar beech mein kisi bhi operation mein error aa jaata hai, toh hum abortTransaction() karte hain, aur transaction ke andar ki saari changes rollback ho jaati hain — matlab unhe final database state ka part nahi banaya jaata. Isliye simple way mein: transaction ke andar operations individually execute hote hain, but unka final commit tab hota hai jab poora transaction successfully complete ho.

//JUST TO MAKE ME UNDERSTAND TRANSACTIONS IN DB  
// Yaani to understand think of it like MongoDB has two layers of DB internally which is "Real DB" means our actual DB and a "Fake DB" that we call as "transactions" .Now, ab jo bhi operation hum transaction me likhte hai wo run bhi hote hai one by one but wo hamare real db me nahi transaction db me hote hai ,Now when all the operation done successfully in transaction db . Then using .commit() command , hum mongo ko bolte hai transaction db me pada hua data uthakar real db me daal do BUT if operation does not done successfully in transaction db.   Then we say .abortTransaction() se ki Rollback kar do yaani "error de do" and transaction db me pada hua data , real db me mat daalo . 
// DON'T ASSUME THE TRANSACTION DB AS WHAT WE MADE THE TRANSACTION MODEL AND TRANSACTION CONTROLLER FOR . NO! THAT IS DIFFERENT . AND CONCEPT OF REAL DB AND TRANSACTION DB IS DIFFERNT AND I JUST MADE TO MAKE ME UNDERSTAND THIS CONCEPT THAT HOW TRANSACTIONS WORK .