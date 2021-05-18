"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");

describe("Users Routes Test", function () {

    beforeEach(async function () {
      await db.query("DELETE FROM messages");
      await db.query("DELETE FROM users");
  
      let u1 = await User.register({
        username: "test1",
        password: "password",
        first_name: "Test1",
        last_name: "Testy1",
        phone: "+14155550000",
      });
    });
  
    /** GET /users/ => [{username, first_name, last_name}, ...]  */
  
    describe("GET /users/", function () {
      test("can view all users if logged in", async function () {
        let response = await request(app)
        .post("/auth/login")
        .send({ username: "test1", password: "password" });
        let token = response.body.token;
        console.log("token from get /users/--->", token)
        // let user = await User.get("test1");
        // console.log("user from /users/--->", user)
        // await User.authenticate(user.username, "password");
        let respUsers = await request(app)
            .get("/users/")
            .send({_token: token});
        console.log("respUsers --->", respUsers)

        expect(jwt.decode(token)).toEqual({
            username: "test1",
            iat: expect.any(Number)
        });

        expect(respUsers.res.text).toBe('{"users":[{"username":"test1","first_name":"Test1","last_name":"Testy1"}]}');
        expect(respUsers.statusCode).toEqual(200);
        expect(respUsers.body.users.length).toEqual(1);

      });

      test("can't view all users if not logged in", async function(){
        let response = await request(app)
        .get("/users/")

        expect(response.statusCode).toEqual(401);
      });
    });
  });
  
  afterAll(async function () {
    await db.end();
  });