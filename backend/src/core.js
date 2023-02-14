import venom from "venom-bot";
import { venomOptions } from "./config";
import express from "express";
import fs from "fs";
import { exec } from "child_process";
import mime from "mime-types";
import { getPedidos, createPedido } from "../repositories/pedidoRepository";
import * as path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import cors from "cors";
import { Users } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import bodyParser from "body-parser";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { session, stop } from "./chatbot.js";
const forceSSL = require("express-force-ssl");

/**
 * Create a chatbot http Qr login
 * @param {String} name
 * @param {Number} port
 */
export async function httpCtrl(name, port) {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json()); // support json encoded bodies
  // app.use(forceSSL);
  //app.enable("trust proxy");
  // if (!fs.existsSync("logs")) {
  //   fs.mkdirSync("logs", { recursive: true });
  //   fs.writeFileSync("logs/logs.log", "");
  //   fs.writeFileSync("logs/conversations.log", "");
  // }
  // const __filename = fileURLToPath(import.meta.url);
  // const __dirname = path.dirname(__filename);
  // app.use(express.static(path.join(__dirname, "dist/frontend")));

  const authenticate = async (req, res, next) => {
    let authorized = false;
    const { email, senha } = req.body;

    tokenCheck(req).then((result) => {
      if (result) {
        authorized = true;
        next();
        return authorized;
      } else if (email && senha) {
        Users.findOne({ where: { email: email } }).then((user) => {
          if (user && bcrypt.compare(senha, user.senha)) {
            // Create token
            const token = jwt.sign(
              { user_id: user._id, email },
              process.env.TOKEN_KEY,
              {
                expiresIn: "7 days",
              }
            );
            // save user token in database
            user.token = token;
            user.save();
            // user
            let ret = {
              user: user,
              token: token,
            };
            res.status(200).json(ret);
            authorized = true;
            return authorized;
          }
        });
      }
    });
    if (!authorized) {
      res.status(401).send("Not authorized");
    }
  };

  const tokenCheck = async (req) => {
    const tokenCheck = req.headers["authorization"];
    let isValid = false;

    try {
      const authToken = tokenCheck.split(" ")[1];
      const decoded = jwt.verify(authToken, process.env.TOKEN_KEY);
      if (decoded) {
        req.email = decoded;
        isValid = true;
        next();
        return isValid;
      }
    } catch (error) {
      return isValid;
    }
  };

  app.use("/index", authenticate, function (req, res) {
    try {
      const user = Users.findAll();
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json(error);
    }
  });
  app.post("/api/handleBot", authenticate, (req, res, next) => {
    const name = req.email.email;
    const { conversationName, order } = req.body;
    if (order == "stop") {
      stop(name);
      res.status(200).send(`Bot stopped.`);
      return;
    }
    const conversationPath = `conversations/${conversationName}.js`;
    let array = [];
    const conversation = fs.readFile(
      path.join(__dirname, conversationPath),
      "utf-8",
      (err, data) => {
        if (err) {
          throw err;
        }
        const exported = import(
          `./conversations/${conversationName}.js?param=${name}`
        );
        exported.then((module) => {
          array = module.default;
          if (!name || !array) {
            res.status(500).send("Something went wrong with session params.");
          } else {
            session(name, array, order);
            res.status(200).send(`Bot started.`);
          }
        });
      }
    );
  });
  app.get("/api/data", authenticate, (req, res, next) => {
    //authorize(req, res);
    const name = req.email.email;
    const infoPath = `tokens/${name}/info.json`;
    const qrPath = `tokens/${name}/qr.json`;
    const sessPath = `tokens/${name}/session.json`;
    const info = fs.existsSync(infoPath)
      ? JSON.parse(fs.readFileSync(infoPath))
      : null;
    const qr = fs.existsSync(qrPath)
      ? JSON.parse(fs.readFileSync(qrPath))
      : null;
    const sess = fs.existsSync(sessPath)
      ? JSON.parse(fs.readFileSync(sessPath))
      : null;

    const logs = fs
      .readFileSync("logs/logs.log")
      .toString()
      .replace(/\n/g, "<br>");
    const flow = fs
      .readFileSync("logs/conversations.log")
      .toString()
      .replace(/\n/g, "<br>");
    res.json({
      info,
      session: sess,
      qr: qr,
      logs: logs,
      conversation: flow,
    });
  });
  app.get("/api/connection", async (req, res, next) => {
    //authorize(req, res);
    const name = req.email.email;
    const connectionPath = `tokens/${name}/connection.json`;
    const connection = fs.existsSync(connectionPath)
      ? JSON.parse(fs.readFileSync(connectionPath))
      : null;
    res.json({ status: connection?.status });
  });
  app.get("/api/controls/start", (req, res, next) => {
    //authorize(req, res);
    exec("npm run start", (err, stdout, stderr) => {
      if (err) {
        res.json({ status: "ERROR" });
        console.error(err);
        return;
      }
      res.json({ status: "OK" });
      console.log(stdout);
      log("Start", `Start chatbot...`);
    });
  });
  app.get("/api/controls/stop", (req, res, next) => {
    authorize(req, res);
    exec("npm run stop", (err, stdout, stderr) => {
      if (err) {
        res.json({ status: "ERROR" });
        console.error(err);
        return;
      }
      res.json({ status: "OK" });
      console.log(stdout);
      log("Stop", `Stop chatbot...`);
    });
  });
  app.get("/api/controls/reload", (req, res, next) => {
    //authorize(req, res);
    exec("npm run reload", (err, stdout, stderr) => {
      if (err) {
        res.json({ status: "ERROR" });
        console.error(err);
        return;
      }
      res.json({ status: "OK" });
      console.log(stdout);
      log("Reload", `Reload chatbot...`);
    });
  });
  app.get("/api/controls/restart", (req, res, next) => {
    //authorize(req, res);
    exec("npm run restart", (err, stdout, stderr) => {
      if (err) {
        res.json({ status: "ERROR" });
        console.error(err);
        return;
      }
      res.json({ status: "OK" });
      console.log(stdout);
      log("Restart", `Restart chatbot...`);
    });
  });
  app.get("/api/controls/log/clear", (req, res, next) => {
    //authorize(req, res);
    exec("> logs/logs.log", (err, stdout, stderr) => {
      if (err) {
        res.json({ status: "ERROR" });
        console.error(err);
        return;
      }
      res.json({ status: "OK" });
      console.log(stdout);
    });
  });
  app.get("/api/pedidos", (req, res, next) => {
    //authorize(req, res);
    getPedidos().then((pedidos) => {
      res.json(pedidos);
    });
  });
  app.post("/api/pedidos/create", authenticate, (req, res, next) => {
    //authorize(req, res);
    const pedido = req.body;
    try {
      createPedido(pedido).then((pedido) => {
        res.json(pedido);
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/register", authenticate, async (req, res) => {
    // Our register logic starts here
    try {
      const { nome, email, senha } = req.body;
      // Validate user input
      if (!(email && nome && senha)) {
        res.status(400).send("All input is required");
      }

      // check if user already exist
      // Validate if user exist in our database
      const oldUser = await Users.findOne({ where: { email: email } });

      if (oldUser) {
        return res.status(409).send("User Already Exist. Please Login");
      } else {
        //Encrypt user password
        const encryptedPassword = await bcrypt.hash(senha, 10);

        // Create user in our database
        const user = await Users.create({
          nome,
          email: email.toLowerCase(), // sanitize: convert email to lowercase
          senha: encryptedPassword,
        });

        // Create token
        const token = jwt.sign(
          { user_id: user._id, email },
          process.env.TOKEN_KEY,
          {
            expiresIn: "24h",
          }
        );
        // save user token
        user.token = token;

        // return new user
        res.status(201).json(user);
      }
    } catch (err) {
      console.log(err);
      res.sendStatus(403).json(err);
    }
    // Our register logic ends here
  });
  app.post("/api/login", authenticate, (req, res) => {
    res.send("Successfully logged in");
  });
  app.listen(port, () => {
    console.log(
      `[${name}] Http chatbot control running on http://localhost:${port}/`
    );
  });
}
