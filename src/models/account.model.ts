import mongoose, { Types, Model } from "mongoose";
import { ledgerModel } from "./ledger.model.js";

interface Iaccount {
  userId: Types.ObjectId;
  status: string;
  currency: string;
}

interface AccountMethods {
  getBalance(): Promise<number>;
}


type AccountModel = Model<Iaccount,{},AccountMethods>;


const accountSchema = new mongoose.Schema<Iaccount,AccountModel,AccountMethods>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: [true, "Account must be associated with a user"],
  },
  status: {
    type:String,
    enum:{
      values: ["ACTIVE", "FROZEN", "CLOSED"],
      message: "Status can be either ACTIVE , FROZEN or CLOSED"
    },
    default:"ACTIVE"
  },
  currency: {
    type: String,
    required: [true, "Currency is required for creating an account"],
    default:"INR"
  },
}, {
  timestamps:true
})

accountSchema.index({ userId: 1, status: 1 });  //User for faster query 

accountSchema.methods.getBalance = async function () {  // It means we made that every "account" table document can use a method called getBalance().
  const balanceData = await ledgerModel.aggregate([  //mongodb aggregation pipeline used here . Yaani is pipeline me jo bhi hoga one by one hoga like Pehle {$match} chalega and then {$group} and then {$project} . That's what it means for a pipeline .
    { $match: { account: this._id } }, //It finds all documents in ledgerModel where ledger.account === this._id and     "this" means the document jispar hum, .getBalance lagakar call kar rahe hai yeh method yaani "isFromAccountExists" me pada hua document .
    {
      $group: {  // Yaani selected documents ko groups me todo or group me divide karo like : totalDebit group and totalCreditgroup
        _id: null,  //The _id tell here like On what basis should I group these documents ? So, we said kisi ke basis par nahi , sab de do .
        totalDebit: {
          $sum: { //It sums up all the returns, that we are getting when documents passing or failing the condition .
            $cond: [
              { $eq: ["$type", "DEBIT"] },  // It means :   If type == "DEBIT" return amount Else return 0 . Yaani jis-jis document me type field debit hai un sabhi ka amount return karo and jis-jis field me type field me debit nahi hai return 0 only .
              "$amount",
              0
            ]
          }
        },
        totalCredit: {
          $sum: {
            $cond: [
              { $eq: ["$type", "CREDIT"] },
              "$amount",
              0
            ]
          }
        }
      }
    },
    {
      $project: { //$project is an aggregation pipeline stage in MongoDB used to control what fields you want in the output and optionally create calculated fields.
        _id: 0, //It means Don’t include _id in the final result or array .
        balance:{$subtract:["$totalCredit","$totalDebit"]}
      }
    }
  ]) 

// In this pipline what we did :   Firstly , we took all the documents where ledger.account === this._id    ->   grouped all those with _id:null  and then we calculated the totalDebits  and  totalCredits   -> then we selected or calculated what to return .
// Aggregation pipline always returns a array with fields as key-value pairs at [0] position  like ForExample ->  [{balance: 100}]
// This is what we called as Aggregation pipline in mongo which is used for CUSTOM QUERIES in a sequence .

  
// Let, say if some user have no transaction then doing this   return balanceData[0].balance  gives a empty array . So,that's why we put a check here such return type is "number" all the time.
  if (balanceData.length === 0) {
    return 0; //Yaani if no transaction then balance is 0
  }
  return balanceData[0].balance 
}

export const accountModel = mongoose.model<Iaccount,AccountModel>("account", accountSchema);