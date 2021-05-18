"use strict";

const Router = require("express").Router;
const router = new Router();
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const Message = require("../models/message");
const {UnauthorizedError} = require("../expressError");


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async function (req, res, next) {
  let id = req.params.id;
  let message = await Message.get(id);
  if (res.locals.user.username === message.from_username || res.locals.user.username === message.to_username) {
    return res.json({ message });
  } else {
    throw new UnauthorizedError();
  }
});



/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async function(req, res, next) {
  let {to_username, body} = req.body;
  let fromUsername = res.locals.user.username;
  let newMessage = await Message.create({fromUsername, to_username, body});
  return res.json({newMessage});
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureCorrectUser, async function(req, res, next) {
  let messageId = req.params.id;
  let message = await Message.get(messageId);
  if (res.locals.user.username === message.to_user.username) {
    let readMessage = await Message.markRead(messageId);
    return res.json({readMessage});
  } else {
    throw new UnauthorizedError();
  }
});


module.exports = router;