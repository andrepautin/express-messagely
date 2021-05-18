"use strict";

const Router = require("express").Router;
const router = new Router();
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { SECRET_KEY } = require("../config");
const { BadRequestError } = require("../expressError");


/** POST /login: {username, password} => {token} */
router.post("/login", async function (req, res, next) {
  let { username, password } = req.body;
  // console.log("USERNAME IS--->", username);
  if (await User.authenticate(username, password) === true) {
    let token = jwt.sign({ username }, SECRET_KEY);
    // console.log("TOKEN IS--->", token);
    await User.updateLoginTimestamp(username);
    return res.json({ token });
  } else {
    // console.log("SOMETHING WENT WRONG");
    throw new BadRequestError();
  }
});

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post("/register", async function (req, res, next) {
  let { username, password, first_name, last_name, phone } = req.body;
  await User.register({ username, password, first_name, last_name, phone });
  let token = jwt.sign({ username }, SECRET_KEY);
  // console.log("TOKEN IS--->", token);
  return res.json({ token });
});

module.exports = router;