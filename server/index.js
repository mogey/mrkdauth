import express from "express";
import dotenv from "dotenv";
dotenv.config();
import bodyParser from "body-parser";
import Sequelize from "sequelize";
import { findUserByUsername, UserModel } from "./models/UserModel.js";
import { UserRouter } from "./routes/UserRoutes.js";
const { DataTypes } = Sequelize;
import Redis from "ioredis";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { TokenModel } from "./models/TokenModel.js";
import nodemailer from "nodemailer";

export const mailerTransport = await nodemailer.createTransport({
  sendmail: true,
});

export const redisClient = new Redis({
  port: process.env.REDIS_PORT,
  host: process.env.REDIS_HOST,
  family: 4,
  password: process.env.REDIS_PASSWORD,
  lazyConnect: true,
});

redisClient.connect(() => {
  console.log("Connected to Redis Server");
});

//Initialize DB connection
export const sequelizeInstance = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER_ACCOUNT,
  process.env.MYSQL_USER_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
  }
);

//Check to make sure we connected
try {
  await sequelizeInstance.authenticate();
  console.log("Database connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

//Define the model for the Players table

export const User = UserModel(sequelizeInstance);
export const Token = TokenModel(sequelizeInstance);

Token.belongsTo(User);

//Create the table for Player if it does not already exist
await User.sync().then((response) => {
  console.log("Created database table for users");
});

await Token.sync().then((response) => {
  console.log("Created database table for tokens");
});

const app = express();
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cookieParser());
const port = process.env.PORT || 5000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use("/api", UserRouter);

app.listen(port, () => {
  console.log("Server is listening on port " + port);
});
