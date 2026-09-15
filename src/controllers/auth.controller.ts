import type{ Request,Response } from "express";
import { userModel } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendRegistrationEmail, sendLoginEmail } from "../services/email.service.js";
import { SECRET_KEY } from "../config/env.js";
import {Types} from "mongoose";
import { tokenBlackListModel } from "../models/blackList.model.js";



interface RegisterUserBody {
  email: string;
  password: string;
  name: string;
}


//signup route at /api/auth/register
export async function userRegisterController(req:Request<{}, {}, RegisterUserBody>,res:Response):Promise<void>{        
  const { email, password, name } = req.body;
  const isExists = await userModel.findOne({
    email: email
  });

  if (isExists) {
    res.status(422).json({
      message: "User already exists with this email",
      status:"failed"
    })
    return;
  };

  const user = await userModel.create({   // database me yeh data create kar do
    email, password, name
  });

  if (!SECRET_KEY) {
    throw new Error("Invalid Secret Key");
  };
  const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: "3d" });

  res.cookie("token", token);

  res.status(201).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name
    },
    token
  });

  await sendRegistrationEmail(user.email, user.name);

}






interface LoginUserBody {
  email: string;
  password: string;
}


//login route at /api/auth/login
export async function userLoginController(req:Request<{}, {}, LoginUserBody>,res:Response): Promise<void>  {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email }).select("+password"); //Kyuki humne password me select = true kiya hai toh jab tak alag se nahi mangenge tab tak password nahi aayega .

  if (!user) {
    res.status(401).json({
      message: "Email or Password is Invalid"
    });
    return;
  };

  const validPassword = await user.comparePassword(password); //we are calling the method of the document which came in "user" when we asked .

  if (!validPassword) {
    res.status(401).json({
      message: "Email or Password is Invalid"
    });
    return;
  };

  if (!SECRET_KEY) {
    throw new Error("Invalid Secret Key");
  };
  
  const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: "3d" });

  res.cookie("token", token);

  res.status(200).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name
    },
    token
  })

  await sendLoginEmail(user.email, user.name);
  
}


// Logout api : In this we firstly cleared the token from the cookie and then put that token in the blackListToken table such that agar let say humne cookie se toh token clear kar diya hai but kya pata clear karne se pehle kisi ke haath wo token lag gaya , tab toh logout ke baad bhi wo us token ka galat use kar lega . That's why we put that token in blackListToken table such that logout ke baad bhi yaani cookie se clear hone ke baad bhi , agar kisi ke paas wo token aa bhi jaaye toh bhi wo token kisi kaam ka naa ho . Humne token expiry time 3 days rakha hai cookie me and blacklisttoken table me bhi 3 days kyuki blacklist record only needs to exist until the JWT would naturally expire. Kyuki let say kisi hacker ke paas token tha even after user logout and use pata hai ki blacklistTable se bhi token remove ho jaate hai 3 days from the day of creation . So, mai 3 days ke baad use kar lunga 4th day and acces the user account . So, to prevent this blackList me pade hue token expiry ki timing always greater than honi chahiye jwt token ke natural(yaani jwt.sign waale time) expiry time se . Isse ab agar user ke paas 4th day token hai bhi toh bhi uska koi use nahi hai kyuki ab naturally(yaani jwt token sign ka time) bhi wo token expire ho chuka hai .

export async function UserLogoutController(req:Request,res:Response):Promise<void> {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(400).json({
      "message": "Unauthorized access,token is missing"
    });
    return;
  }

  res.clearCookie("token");

  await tokenBlackListModel.create({
    token
  });

  res.status(200).json({
    message:"User Logged out successfully"
  })
}