import bcrypt from "bcrypt";
import {
  createUser,
  findUserByEmail,
  findUserByID,
  findUserByUsername,
} from "../models/UserModel.js";
import { redisClient } from "../index.js";
import validator from "validator";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const registerUser = async (model, username, password, email) => {
  const user = await bcrypt.hash(password, 10).then((hash) => {
    return createUser(model, username, hash, email);
  });

  return user;
};

const loginUser = async (model, username, password) => {
  const findUser = (model) => {
    if (validator.isEmail(username)) {
      return findUserByEmail(model, username);
    } else {
      return findUserByUsername(model, username);
    }
  };

  const user = await findUser(model);

  if (!user) {
    return { status: "error", message: "Username or password do not match" };
  }
  if (user) {
    const passwordMatches = bcrypt
      .compare(password, user.password)
      .then((result) => {
        return true;
      });
    if (passwordMatches) {
      const token = generateJWT(user);
      redisClient.set(token, " ", "EX", 28000);
      return { status: "success", token: token };
    } else {
      return { status: "error", message: "Username or password do not match" };
    }
  }
};

const generateJWT = (user) => {
  return jwt.sign(
    { userID: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    {
      expiresIn: "8h",
    }
  );
};

const isVerifiedJWT = async (model, token) => {
  return await jwt.verify(
    token,
    process.env.JWT_SECRET,
    async (err, payload) => {
      if (err) {
        redisClient.del(token);
        return false;
      }
      if (!payload) {
        redisClient.del(token);
        return false;
      }
      if (payload.userID) {
        const user = await findUserByID(model, payload.userID);
        if (user) {
          if (user.id === payload.userID) {
            if (await redisClient.get(token)) {
              return true;
            } else {
              return false;
            }
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  );
};

const invalidateToken = async (token) => {
  if (token) {
    redisClient.del(token);
    return true;
  }
  return false;
};

export { registerUser, loginUser, isVerifiedJWT, invalidateToken };
