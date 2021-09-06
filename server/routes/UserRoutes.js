import express from "express";
const UserRouter = express.Router();
import {
  deleteUser,
  forgotPassword,
  getAllSessions,
  getAllTokens,
  getAllUsers,
  invalidateAllTokens,
  invalidateToken,
  isSessionValid,
  isUserAdmin,
  isVerifiedJWT,
  loginUser,
  loginUserWithToken,
  registerUser,
  resetPassword,
  verifyEmail,
} from "../services/UserService.js";
import { Token, User } from "../index.js";
import validator from "validator";

UserRouter.post("/register", async (req, res) => {
  if (!req.body.username) {
    return res.status(400).json({
      ...req.body,
      status: "error",
      password: "",
      message: "Username is required",
    });
  }
  if (!req.body.password) {
    return res.status(400).json({
      ...req.body,
      status: "error",
      password: "",
      message: "Password is required",
    });
  }
  if (!req.body.email) {
    return res.status(400).json({
      ...req.body,
      status: "error",
      password: "",
      message: "Email is required",
    });
  }
  if (!validator.isAlphanumeric(req.body.username)) {
    return res.status(400).json({
      ...req.body,
      status: "error",
      password: "",
      message: "Username is invalid",
    });
  }
  if (!validator.isEmail(req.body.email)) {
    return res.status(400).json({
      ...req.body,
      status: "error",
      password: "",
      message: "Email is invalid",
    });
  }
  if (!validator.isAscii(req.body.password)) {
    return res.status(400).json({
      ...req.body,
      status: "error",
      password: "",
      message: "Password is invalid",
    });
  }

  const newUser = await registerUser(
    User,
    Token,
    req.body.username,
    req.body.password,
    req.body.email
  );

  if (newUser) {
    return res
      .status(201)
      .json({ ...req.body, password: "", status: "success" });
  } else {
    res.status(400).json({
      ...req.body,
      status: "error",
      password: "",
      message: "User registration service failiure",
    });
  }
});

UserRouter.post("/login", async (req, res) => {
  if (
    req.cookies.mrkdauth &&
    (await isSessionValid(req.cookies.mrkdauth)) &&
    !req.body.password
  ) {
    console.log("nom nom");
    const response = await loginUserWithToken(User, req.cookies.mrkdauth);
    if (!response.token) {
      res.json({ ...req.body, ...response });
      return;
    } else {
      res.status(401).cookie("mrkdauth", response.token, {
        httpOnly: true,
      });
      res.status(200).json({
        ...req.body,
        status: "success",
        username: response.username,
        email: response.email,
      });
      return;
    }
  }
  console.log("password login");
  if (!req.body.username) {
    return res.status(400).json({
      ...req.body,
      password: "",
      status: "error",
      message: "Username is required",
    });
  }
  if (!req.body.password) {
    return res.status(400).json({
      ...req.body,
      password: "",
      status: "error",
      message: "Password is required",
    });
  }
  if (!validator.isAlphanumeric(req.body.username)) {
    return res.status(400).json({
      ...req.body,
      password: "",
      status: "error",
      message: "Username is invalid",
    });
  }
  if (!validator.isAscii(req.body.password)) {
    return res.status(400).json({
      ...req.body,
      status: "error",
      password: "",
      message: "Password is invalid",
    });
  }
  const response = await loginUser(User, req.body.username, req.body.password);

  if (!response.token) {
    res.status(401).json({ ...req.body, password: "", ...response });
    return;
  } else {
    res.cookie("mrkdauth", response.token, {
      httpOnly: true,
    });
    res.status(200).json({
      ...req.body,
      password: "",
      status: "success",
      username: response.username,
      email: response.email,
    });
    return;
  }
});

UserRouter.post("/validate/:token", async (req, res) => {
  if (!req.params.token) {
    return res
      .status(400)
      .json({ status: "error", message: "No token specified" });
  }
  if (!validator.isJWT(req.params.token)) {
    return res.status(401).json({ token: req.params.token, status: "invalid" });
  }
  if (await isVerifiedJWT(User, req.params.token)) {
    return res.status(200).json({ token: req.params.token, status: "valid" });
  } else {
    return res.status(401).json({ token: req.params.token, status: "invalid" });
  }
});

UserRouter.post("/validate", async (req, res) => {
  if (!req.cookies.mrkdauth) {
    return res
      .status(400)
      .json({ status: "error", message: "No token specified" });
  }
  if (!validator.isJWT(req.cookies.mrkdauth + "")) {
    return res
      .status(400)
      .json({ token: req.cookies.mrkdauth, status: "invalid" });
  }
  if (await isVerifiedJWT(User, req.cookies.mrkdauth)) {
    return res
      .status(200)
      .json({ token: req.cookies.mrkdauth, status: "valid" });
  } else {
    return res
      .status(401)
      .json({ token: req.cookies.mrkdauth, status: "invalid" });
  }
});

UserRouter.post("/forgotPassword", async (req, res) => {
  if (!req.body.email) {
    return res
      .status(400)
      .json({ status: "error", message: "No email specified" });
  }

  if (!validator.isEmail(req.body.email)) {
    return res
      .status(400)
      .json({ status: "error", message: "Email is invalid" });
  }

  const serviceResponse = await forgotPassword(User, Token, req.body.email);

  if (serviceResponse) {
    return res.status(201).json({ status: "success" });
  } else {
    return res
      .status(500)
      .json({ status: "error", message: "User not found or server errored" });
  }

  return;
});

UserRouter.post("/resetPassword/:token", async (req, res) => {
  if (!req.body.password) {
    return res.status(400).json({
      ...req.body,
      status: "error",
      message: "Password is required",
    });
  }
  if (!req.params.token) {
    return res
      .status(400)
      .json({ status: "error", message: "No token specified" });
  }
  if (!validator.isAscii(req.body.password)) {
    return res.status(400).json({
      ...req.body,
      status: "error",
      message: "Password is invalid",
    });
  }

  const serviceResponse = await resetPassword(
    User,
    Token,
    req.params.token,
    req.body.password
  );

  if (serviceResponse) {
    res.status(200).json({ status: "success" });
  } else {
    res.status(500).json({ status: "error" });
  }
});

UserRouter.post("/verifyEmail/:token", async (req, res) => {
  if (!req.params.token) {
    return res
      .status(400)
      .json({ status: "error", message: "No token specified" });
  }

  const serviceResponse = await verifyEmail(User, Token, req.params.token);

  if (serviceResponse) {
    res.status(200).json({ status: "success" });
  } else {
    res.status(500).json({ status: "error" });
  }
});

UserRouter.delete("/logout", async (req, res) => {
  if (!req.cookies.mrkdauth) {
    return res
      .status(400)
      .json({ status: "error", message: "No token specified" });
  }
  if (!validator.isJWT(req.cookies.mrkdauth)) {
    return res
      .status(400)
      .json({ token: req.cookies.mrkdauth, status: "invalid" });
  }
  const response = await invalidateToken(req.cookies.mrkdauth);

  if (response) {
    res.clearCookie("mrkdauth");
    return res.status(200).json({ status: "success" });
  }
  return res.status(500).json({ status: "error" });
});

UserRouter.get("/admin/allUsers", async (req, res) => {
  if (!req.cookies.mrkdauth) {
    return res.status(401).json();
  }

  const userToken = await isVerifiedJWT(User, req.cookies.mrkdauth.toString());

  if (userToken) {
    if (await isUserAdmin(User, userToken.userID)) {
      return res.status(200).json(await getAllUsers(User));
    } else {
      return res.status(401).json();
    }
  } else {
    return res.status(401).json();
  }
});

UserRouter.get("/admin/allTokens", async (req, res) => {
  if (!req.cookies.mrkdauth) {
    return res.status(401).json();
  }

  const userToken = await isVerifiedJWT(User, req.cookies.mrkdauth.toString());

  if (userToken) {
    if (await isUserAdmin(User, userToken.userID)) {
      return res.status(200).json(await getAllTokens(User));
    } else {
      return res.status(401).json();
    }
  } else {
    return res.status(401).json();
  }
});

UserRouter.get("/admin/allSessions", async (req, res) => {
  if (!req.cookies.mrkdauth) {
    return res.status(401).json();
  }

  const userToken = await isVerifiedJWT(User, req.cookies.mrkdauth.toString());

  if (userToken) {
    if (await isUserAdmin(User, userToken.userID)) {
      return res.status(200).json(await getAllSessions());
    } else {
      return res.status(401).json();
    }
  } else {
    return res.status(401).json();
  }
});

UserRouter.delete("/admin/deleteUser", async (req, res) => {
  if (!req.cookies.mrkdauth) {
    return res.status(401).json();
  }
  if (!req.body.deleteThisUserID) {
    return res.status(400).json();
  }

  const userToken = await isVerifiedJWT(User, req.cookies.mrkdauth.toString());

  if (userToken) {
    if (await isUserAdmin(User, userToken.userID)) {
      const serviceResponse = await deleteUser(User, req.body.deleteThisUserID);
      if (serviceResponse) {
        return res.status(200).json({ status: "success" });
      } else {
        return res.status(500).json({
          ...req.body,
          status: "error",
          message: "Delete user service failiure",
        });
      }
    } else {
      return res.status(401).json();
    }
  } else {
    return res.status(401).json();
  }
});

UserRouter.delete("/admin/revokeSession", async (req, res) => {
  if (!req.cookies.mrkdauth) {
    return res.status(401).json();
  }
  if (!req.body.sessionID) {
    return res.status(400).json();
  }

  const userToken = await isVerifiedJWT(User, req.cookies.mrkdauth.toString());

  if (userToken) {
    if (await isUserAdmin(User, userToken.userID)) {
      const serviceResponse = await invalidateToken(req.body.sessionID);
      if (serviceResponse) {
        return res.status(200).json({ status: "success" });
      } else {
        return res.status(500).json({
          ...req.body,
          status: "error",
          message: "Invalidate session service failiure",
        });
      }
    } else {
      return res.status(401).json();
    }
  } else {
    return res.status(401).json();
  }
});

UserRouter.delete("/admin/revokeAllSessions", async (req, res) => {
  if (!req.cookies.mrkdauth) {
    return res.status(401).json();
  }

  const userToken = await isVerifiedJWT(User, req.cookies.mrkdauth.toString());

  if (userToken) {
    if (await isUserAdmin(User, userToken.userID)) {
      const serviceResponse = await invalidateAllTokens();
      if (serviceResponse) {
        return res.status(200).json({ status: "success" });
      } else {
        return res.status(500).json({
          status: "error",
          message: "Invalidate all sessions service failiure",
        });
      }
    } else {
      return res.status(401).json();
    }
  } else {
    return res.status(401).json();
  }
});

UserRouter.delete("/admin/deleteToken", async (req, res) => {
  if (!req.cookies.mrkdauth) {
    return res.status(401).json();
  }
  if (!req.body.deleteThisTokenID) {
    return res.status(400).json();
  }

  const userToken = await isVerifiedJWT(User, req.cookies.mrkdauth.toString());

  if (userToken) {
    if (await isUserAdmin(User, userToken.userID)) {
      const serviceResponse = await deleteToken(
        Token,
        req.body.deleteThisTokenID
      );
      if (serviceResponse) {
        return res.status(200).json({ status: "success" });
      } else {
        return res.status(500).json({
          ...req.body,
          status: "error",
          message: "Delete token service failiure",
        });
      }
    } else {
      return res.status(401).json();
    }
  } else {
    return res.status(401).json();
  }
});

export { UserRouter };
