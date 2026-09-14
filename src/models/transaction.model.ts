import mongoose , {Model, Types} from "mongoose";

interface Itransaction {
  fromAccount: Types.ObjectId,
  toAccount: Types.ObjectId,
  status: string,
  amount: number,
  idempotencyKey:string
}

type TransactionModel = Model<Itransaction> ;

const transactionSchema = new mongoose.Schema<Itransaction,TransactionModel>({
  fromAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "account",
    required: [true, "Transaction must be associated with a from account"],
    index: true
  },
  toAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "account",
    required: [true, "Transactions must be associated with a to account"]
  },
  status: {
    type: String,
    enum: {
      values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
      message: "Status can be either PENDING , COMPLETED , FAILED or REVERSED"
    },
    default: "PENDING"
  },
  amount: {
    type: Number,
    required: [true, "Amount is required for creating a transaction"],
    min: [0, "Amount cannot be a negative value"]
  },
  idempotencyKey: { //Idempotency key hoti hai , ki let say user ne qr scan kiya and pin daala and pay button click kiya , toh ab kya hoga ki ek transaction request client side se jaayegi server par , server us request ko lega and db me us transaction ko daal dega sabse pehle and then us transaction ko process(yaani A ke account se paisa kaatna and B me wo paisa add ) karna start karega , ab let say process hone me time lag raha hai toh client side kya hoga ki usko lagega ki kuch connection problem.
    type: String,
    required: [true, "Idempotency key is required for a transaction"],
    index: true,
    unique: true // Its unique for each transaction .
  }, // request gayi nahi server tak , toh client side par apne aap phir se request jaayegi server par with same credentials yaani same idempotanency key and ab server us transaction request ko db me daalne ke liye ,db ko dega but db bolega ki same idempotency waali transaction toh pehle se hai db me wo bhi PENDING state me yaani kuch network error nahi tha abhi wo purani request process ho rahi hai ,toh db us dusari request ko reject kar dega db me daalne se ,This is how we prevent transaction duplication.
}, {
  timestamps: true
});


export const transactionModel = mongoose.model<Itransaction>("transaction", transactionSchema);