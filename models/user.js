"use strict";
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR, DB_URI } = require("../config");
const db = require("../db");
const { NotFoundError } = require("../expressError");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    let hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
      VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
      RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]);
    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
      FROM users
      WHERE username = $1`,
      [username]);
    const user = result.rows[0];
    if (user) {
      if (await bcrypt.compare(password, user.password) === true) {
        return true;
      }
    }
    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
      SET last_login_at = current_timestamp
      WHERE username = $1
      RETURNING username`,
      [username]);
    // return result.rows[0];
    const user = result.rows[0];
    if (!user) {
      throw new NotFoundError();
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name
      FROM users
      ORDER BY username`
    )
    return result.rows
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      // don't need parentheses around selected fields
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users
      WHERE username = $1`,
      [username]);
    const user = result.rows[0];
    if (!user) {
      throw new NotFoundError();
    }
    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT messages.id as id,
              messages.body as body,
              messages.sent_at as sent_at,
              messages.read_at as read_at,
              messages.to_username as username,
              users.first_name as first_name,
              users.last_name as last_name,
              users.phone as phone
      FROM messages
      JOIN users
      ON users.username = messages.to_username
      WHERE messages.from_username = $1`,
      [username]
    );
    let messages = result.rows
    return messages.map(m => ({
      id: m.id,
      to_user:
      {
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
        username: m.username
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));

  };

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(
    `SELECT messages.id as id,
            messages.body as body,
            messages.sent_at as sent_at,
            messages.read_at as read_at,
            messages.from_username as username,
            users.first_name as first_name,
            users.last_name as last_name,
            users.phone as phone
    FROM messages
    JOIN users
    ON users.username = messages.from_username
    WHERE messages.to_username = $1`,
    [username]
  );
    let messages = result.rows
    return messages.map(m => ({
      id: m.id,
      from_user:
      {
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
        username: m.username
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));
  }
}


module.exports = User;
