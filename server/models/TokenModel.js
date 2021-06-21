import Sequelize from "sequelize";
const { DataTypes } = Sequelize;
import crypto from "crypto";

const TokenModel = (instance) =>
  instance.define("Token", {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      unique: true,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    expires: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

async function createToken(model, userID, type, expiration) {
  const token = crypto.randomBytes(64);
  try {
    const newToken = await model.create({
      type: type,
      expires: expiration.toString(),
      token: token.toString("hex"),
    });
    newToken.setUser(userID);
    return await newToken.save();
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function deleteTokenByID(model, tokenID) {
  try {
    return await model.destroy({
      where: {
        id: tokenID,
      },
    });
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function findTokenById(model, tokenID) {
  try {
    return await model.findOne({ where: { id: tokenID } });
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function findAllTokens(model) {
  try {
    return await model.findAll();
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function findTokenByToken(model, token) {
  try {
    return await model.findOne({ where: { token: token } });
  } catch (err) {
    console.error(err);
    return false;
  }
}

export {
  TokenModel,
  createToken,
  deleteTokenByID,
  findTokenById,
  findTokenByToken,
  findAllTokens,
};
