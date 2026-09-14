import mongoose, { Model, Types }  from "mongoose";

interface Iledger {
  account: Types.ObjectId,
  transaction: Types.ObjectId,
  amount: number,
  type: string
}

type LedgerModel = Model<Iledger>

const ledgerSchema = new mongoose.Schema<Iledger,LedgerModel>({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "account",
    required: [true, "Ledger must be associated with a account"], //
    index: true,
    immutable:true //yaani koi bhi , kisi bhi operation se is field fo edit nahi kar sakta hai as "Everything is immutable in a ledger record"
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "transactions",
    required: [true, "Ledger must be associated with a transaction"],
    index: true,
    immutable: true
  },
  amount: {
    type: Number,
    required: [true, "Amount is required for creating a Ledger entry"],
    immutable:true
  },
  type: {
    type: String,
    enum: {
      values: ["CREDIT", "DEBIT"],
      message:"Type can be either CREDIT or DEBIT"
    },
    required:[true,"Type is required to create a Ledger entry"],
    immutable:true
  }
}, {
  timestamps:true
})


function preventLedgerModification() { // To prevent modification in ledger
  throw new Error ("Ledger entries are immutable and cannot be modified or deleted ")
}


ledgerSchema.pre("findOneAndDelete", preventLedgerModification) // means on these operation when someone runs 
ledgerSchema.pre("findOneAndReplace",preventLedgerModification)
ledgerSchema.pre("findOneAndUpdate",preventLedgerModification)
ledgerSchema.pre("updateOne",preventLedgerModification)
ledgerSchema.pre("updateMany", preventLedgerModification)
ledgerSchema.pre("replaceOne",preventLedgerModification)
ledgerSchema.pre("deleteOne",preventLedgerModification)
ledgerSchema.pre("deleteMany",preventLedgerModification)


export const ledgerModel = mongoose.model<Iledger>("ledger", ledgerSchema);