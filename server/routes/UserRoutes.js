import express from "express";
const UserRouter = express.Router();
import {
  invalidateToken,
  isSessionValid,
  isVerifiedJWT,
  loginUser,
  loginUserWithToken,
  registerUser,
} from "../services/UserService.js";
import { User } from "../index.js";
import validator from "validator";

UserRouter.post("/register", async (req, res) => {
  if (!req.body.username) {
    return res.status(400).json({
      ...req.body,
      status: "error",
      message: "Username is required",
    });
  }
  if (!req.body.password) {
    return res.status(400).json({
      ...req.body,
      status: "error",
      message: "Password is required",
    });
  }
  if (!req.body.email) {
    return res.status(400).json({
      ...req.body,
      status: "error",
      message: "Email is required",
    });
  }
  if (!validator.isAlphanumeric(req.body.username)) {
    return res.status(400).json({
      ...req.body,
      status: "error",
      message: "Username is invalid",
    });
  }
  if (!validator.isEmail(req.body.email)) {
    return res.status(400).json({
      ...req.body,
      status: "error",
      message: "Email is invalid",
    });
  }
  if (!validator.isAlphanumeric(req.body.password)) {
    return res.status(400).json({
      ...req.body,
      status: "error",
      message: "Password is invalid",
    });
  }

  const newUser = await registerUser(
    User,
    req.body.username,
    req.body.password,
    req.body.email
  );

  if (newUser) {
    return res.status(201).json({ ...req.body, status: "success" });
  } else {
    res.status(400).json({
      ...req.body,
      status: "error",
      message: "Database failed to save user",
    });
  }
});

UserRouter.post("/login", async (req, res) => {
  if (
    req.cookies.mrkdauth &&
    (await isSessionValid(req.cookies.mrkdauth)) &&
    !req.body.password
  ) {
    const response = await loginUserWithToken(User, req.cookies.mrkdauth);
    if (!response.token) {
      res.json({ ...req.body, ...response });
      return;
    } else {
      res.status(401).cookie("mrkdauth", response.token, {
        httpOnly: true,
      });
      res.status(200).json({ ...req.body, status: "success" });
      return;
    }
  }

  if (!req.body.username) {
    return res.status(400).json({
      ...req.body,
      status: "error",
      message: "Username is required",
    });
  }
  if (!req.body.password) {
    return res.status(400).json({
      ...req.body,
      status: "error",
      message: "Password is required",
    });
  }
  if (!validator.isAlphanumeric(req.body.username)) {
    return res.status(400).json({
      ...req.body,
      status: "error",
      message: "Username is invalid",
    });
  }
  if (!validator.isAlphanumeric(req.body.password)) {
    return res.status(400).json({
      ...req.body,
      status: "error",
      message: "Password is invalid",
    });
  }
  const response = await loginUser(User, req.body.username, req.body.password);

  if (!response.token) {
    res.status(401).json({ ...req.body, ...response });
    return;
  } else {
    res.cookie("mrkdauth", response.token, {
      httpOnly: true,
    });
    res.status(200).json({ ...req.body, status: "success" });
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

export { UserRouter };
