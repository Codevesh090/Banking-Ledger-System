import "dotenv/config"; //Through this package we can seprate our .env secrets going to github.This package reads the .env and puts its content in process.env which protects our secrets to go out .


export const PORT = process.env.PORT;
export const MONGO_URI = process.env.MONGO_URI;
export const SECRET_KEY = process.env.SECRET_KEY;
export const EMAIL_USER = process.env.EMAIL_USER;
export const CLIENT_ID = process.env.CLIENT_ID;
export const CLIENT_SECRET = process.env.CLIENT_SECRET;
export const REFRESH_TOKEN = process.env.REFRESH_TOKEN;