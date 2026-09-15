import mongoose, { Model } from "mongoose";

interface IBlackListToken {
  token:string
}

type BlackListTokenModel = Model<IBlackListToken>


const tokenBlackListSchema = new mongoose.Schema<IBlackListToken,BlackListTokenModel>({
  token: {
    type: String,
    required: [true, "Token is needed for blacklisting"],
    unique:true
  },
}, {
  timestamps: true
})

tokenBlackListSchema.index({ createdAt: 1 },{ // Matlab createdAt ko through index dundho us document ka and then us date se 3 days after expiry kar do us token ko 
  expireAfterSeconds: 60*60*24*3 //means 3 days
})


export const tokenBlackListModel = mongoose.model("tokenBlackList", tokenBlackListSchema);


