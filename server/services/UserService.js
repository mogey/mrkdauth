import bcrypt from "bcrypt";
import {
  createUser,
  findUserByEmail,
  findUserByID,
  findUserByUsername,
  updateUserByID,
} from "../models/UserModel.js";
import { redisClient } from "../index.js";
import validator from "validator";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

async function registerUser(model, username, password, email) {
  const user = await bcrypt.hash(password, 10).then((hash) => {
    return createUser(model, username, hash, email);
  });

  return user;
}

async function loginUser(model, username, password) {
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
      redisClient.set(token, " ", "EX", 604800);
      await updateUserByID(model, user.id, {
        ...user,
        lastLoggedIn: new Date().toString(),
      });
      return { status: "success", token: token };
    } else {
      return { status: "error", message: "Username or password do not match" };
    }
  }
}

async function loginUserWithToken(model, token) {
  const id = jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      console.log(err);
      return { status: "error", message: "Invalid token" };
    }
    return payload.userID;
  });
  const user = await findUserByID(model, id);

  if (!user) {
    return { status: "error", message: "Username or password do not match" };
  }

  if (isSessionValid(token)) {
    const refreshToken = generateJWT(user);
    await redisClient.del(token);
    await redisClient.set(refreshToken, " ", "EX", 604800);
    await updateUserByID(model, id, {
      ...user,
      lastLoggedIn: new Date().toString(),
    });
    return { status: "success", token: refreshToken };
  } else {
    return { status: "error", message: "Username or password do not match" };
  }
}

function generateJWT(user) {
  return jwt.sign(
    { userID: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    }
  );
}

async function isVerifiedJWT(model, token) {
  return await jwt.verify(
    token,
    process.env.JWT_SECRET,
    async (err, payload) => {
      if (err) {
        await redisClient.del(token);
        return false;
      }
      if (!payload) {
        await redisClient.del(token);
        return false;
      }
      return await isSessionValid(token); /*
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
      }*/
    }
  );
}

async function isSessionValid(token) {
  if (await redisClient.exists(token)) {
    return true;
  } else {
    return false;
  }
}

async function invalidateToken(token) {
  if (token) {
    await redisClient.del(token);
    return true;
  }
  return false;
}

const getAllUsers = async function getAllUsers(model) {
  return;
};

export {
  registerUser,
  loginUser,
  loginUserWithToken,
  isVerifiedJWT,
  invalidateToken,
  isSessionValid,
};
