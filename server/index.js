import express from "express";
import dotenv from "dotenv";
dotenv.config();
import routes from "./routes/api.js";
import bodyParser from "body-parser";
import Sequelize from "sequelize";
const { DataTypes } = Sequelize;

//Initialize DB connection
export const sequelizeInstance = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER_ACCOUNT,
  process.env.MYSQL_USER_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
    logging: () => {},
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
export const Player = sequelizeInstance.define("Player", {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  money: {
    type: DataTypes.BIGINT,
    defaultValue: 1000,
  },
  betAmount: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
  },
  playerHand: {
    type: DataTypes.JSON,
    defaultValue: { cards: [] },
  },
  dealerHand: {
    type: DataTypes.JSON,
    defaultValue: { cards: [] },
  },
  gameDeck: {
    type: DataTypes.JSON,
    defaultValue: { cards: [] },
  },
  state: {
    type: DataTypes.STRING,
    defaultValue: "bet",
  },
});

//Create the table for Player if it does not already exist
await Player.sync().then((response) => {
  console.log("Created database table for player");
});

const app = express();

const port = process.env.PORT || 5000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(bodyParser.json());

app.use("/api", routes);

app.listen(port, () => {
  console.log("Server is listening on port " + port);
});
