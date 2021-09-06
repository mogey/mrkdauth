import bcrypt from "bcrypt";
import {
  createUser,
  deleteUserByID,
  findAllUsers,
  findUserByEmail,
  findUserByID,
  findUserByUsername,
  updateUserByID,
} from "../models/UserModel.js";
import { mailerTransport, redisClient, Token, User } from "../index.js";
import validator from "validator";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
  createToken,
  deleteTokenByID,
  findAllTokens,
  findTokenByToken,
} from "../models/TokenModel.js";
dotenv.config();

async function registerUser(model, TokenModel, username, password, email) {
  const user = await bcrypt.hash(password, 10).then(async (hash) => {
    const newUser = await createUser(model, username, hash, email);
    if (!newUser) return false;
    await verifyEmailService(newUser, TokenModel);
    return newUser;
  });

  return user;
}

async function verifyEmailService(newUser, TokenModel) {
  let expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 2);
  const newToken = await createToken(
    TokenModel,
    newUser.id,
    "verification",
    expirationDate
  );

  const verificationEmail = await sendVerificationEmail(
    newToken.token.toString(),
    newUser
  );
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
    if (await bcrypt.compare(password, user.password)) {
      const token = generateJWT(user);
      redisClient.set(token, " ", "EX", 604800);
      await updateUserByID(model, user.id, {
        ...user,
        lastLoggedIn: new Date().toString(),
      });
      return {
        status: "success",
        token: token,
        username: user.username,
        email: user.email,
      };
    } else {
      return { status: "error", message: "Username or password do not match" };
    }
  }
}

async function loginUserWithToken(model, token) {
  const id = await jwt.decode(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      if (err.name !== "TokenExpiredError") {
        console.log(err);
        return { status: "error", message: "Invalid token" };
      }
    }
  });
  if (id.status === "error") {
    return id;
  }

  const user = await findUserByID(model, id.userID);

  if (!user) {
    return { status: "error", message: "Username or password do not match" };
  }

  if (isSessionValid(token)) {
    const refreshToken = generateJWT(user);
    await redisClient.del(token);
    await redisClient.set(refreshToken, " ", "EX", 604800);
    await updateUserByID(model, id.userID, {
      ...user,
      lastLoggedIn: new Date().toString(),
    });
    return {
      status: "success",
      token: refreshToken,
      username: user.username,
      email: user.email,
    };
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
      if (await isSessionValid(token)) {
        return payload;
      } else {
        return false;
      } /*
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

async function invalidateAllTokens() {
  await redisClient.flushall();
  return true;
}

async function getAllSessions() {
  return await redisClient.keys("*");
}

async function forgotPassword(UserModel, TokenModel, email) {
  try {
    const userToReset = await findUserByEmail(UserModel, email);
    let expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 2);
    if (userToReset) {
      const newToken = await createToken(
        TokenModel,
        userToReset.id,
        "reset",
        expirationDate
      );

      const resetEmail = await sendResetEmail(
        newToken.token.toString(),
        userToReset
      );

      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function isUserAdmin(UserModel, userID) {
  const user = await findUserByID(UserModel, userID);
  if (!user) return false;
  if (user.isAdmin) {
    return true;
  } else {
    return false;
  }
}

async function getAllUsers(UserModel) {
  try {
    return await findAllUsers(UserModel);
  } catch (err) {
    console.error(err);
  }
}

async function getAllTokens(TokenModel) {
  try {
    return await findAllTokens(TokenModel);
  } catch (err) {
    console.error(err);
  }
}

async function deleteUser(UserModel, IDToDelete) {
  try {
    await deleteUserByID(UserModel, IDToDelete);
    return true;
  } catch {
    console.error(error);
    return false;
  }
}

async function deleteToken(TokenModel, IDToDelete) {
  try {
    await deleteTokenByID(TokenModel, IDToDelete);
    return true;
  } catch {
    console.error(error);
    return false;
  }
}

async function resetPassword(UserModel, TokenModel, tokenID, password) {
  try {
    const token = await findTokenByToken(TokenModel, tokenID);
    if (!token) return false;
    if (new Date(token.expires) < Date.now()) {
      await deleteTokenByID(TokenModel, token.id);
      return false;
    }
    const user = await token.getUser();
    const hash = await bcrypt.hash(password, 10);
    await deleteTokenByID(TokenModel, token.id);
    await updateUserByID(UserModel, user.id, { password: hash });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function verifyEmail(UserModel, TokenModel, tokenID) {
  try {
    const token = await findTokenByToken(TokenModel, tokenID);
    if (!token) return false;
    if (new Date(token.expires) < Date.now()) {
      await deleteTokenByID(TokenModel, token.id);
      return false;
    }
    const user = await token.getUser();
    await deleteTokenByID(TokenModel, token.id);
    await updateUserByID(UserModel, user.id, { ...user, verified: true });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function sendResetEmail(tokenString, user) {
  try {
    return await mailerTransport.sendMail({
      from: "auth@mrkdgaming.com",
      to: user.email.toString(),
      subject: "Password reset token",
      text: tokenString,
      html:
        "<h1>Here is your password reset token</h1> <br /><p>" +
        tokenString +
        "</p>",
    });
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function sendVerificationEmail(tokenString, user) {
  try {
    return await mailerTransport.sendMail({
      from: "auth@mrkdgaming.com",
      to: user.email.toString(),
      subject: "Verify your email address",
      text: tokenString,
      html:
        "<h1>Click this link to verify your email</h1> <br /><p>" +
        "http://localhost:3000/verifyEmail/" +
        tokenString +
        "</p>",
    });
  } catch (err) {
    console.error(err);
    return false;
  }
}

export {
  registerUser,
  loginUser,
  loginUserWithToken,
  isVerifiedJWT,
  forgotPassword,
  resetPassword,
  getAllTokens,
  invalidateToken,
  deleteUser,
  invalidateAllTokens,
  isSessionValid,
  getAllSessions,
  isUserAdmin,
  getAllUsers,
  verifyEmail,
};
