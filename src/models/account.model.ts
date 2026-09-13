import mongoose,{Types,Model} from "mongoose";

interface Iaccount {
  userId: Types.ObjectId;
  status: string;
  currency: string;
}

type AccountModel = Model<Iaccount>;


const accountSchema = new mongoose.Schema<Iaccount,AccountModel>({
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

export const accountModel = mongoose.model<Iaccount>("account", accountSchema);