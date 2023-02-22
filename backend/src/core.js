import express from "express";
import fs from "fs";
import { exec } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import cors from "cors";
import { Users } from "../models/user.model.js";
import { Uploads } from "../models/uploads.model.js";
import bcrypt from "bcryptjs";
import bodyParser from "body-parser";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { session, stop } from "./chatbot.js";
const forceSSL = require("express-force-ssl");
import multer from "multer";
import zlib from "zlib";

/**
 * Create a chatbot http Qr login
 * @param {String} name
 * @param {Number} port
 */
export async function httpCtrl(name, port) {
  const app = express();
  const upload = multer({ dest: "uploads/" });
  app.use(cors());
  app.use(bodyParser.json()); // support json encoded bodies
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
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
              user: user.nome,
              token: token,
              email: email,
            };
            res.status(200).json(ret);
            authorized = true;
            return authorized;
          }
        });
      } else {
        res.status(401).send("Unauthorized");
        return authorized;
      }
    });
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
  app.get("/api/connection", authenticate, async (req, res, next) => {
    const name = req.email.email;
    const connectionPath = `tokens/${name}/connection.json`;
    const connection = fs.existsSync(connectionPath)
      ? JSON.parse(fs.readFileSync(connectionPath))
      : null;
    res.json({ status: connection?.status });
  });
  app.get("/api/controls/log/clear", (req, res, next) => {
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
  // Define a route for handling file uploads
  app.post("/api/upload", authenticate, upload.single("file"), (req, res) => {
    try {
      // Retrieve the file contents from the request
      const fileContent = req.file.buffer;
      zlib.gzip(fileContent, (err, compressedData) => {
        if (err) {
          console.error(err);
          res.sendStatus(500).json(err);
        } else {
          // Insert the file data into the database
          Uploads.create({
            name: req.file.originalname,
            type: req.file.mimetype,
            content: compressedData,
            session: req.email.email,
          });
        }
        res.send("File uploaded successfully");
      });
    } catch (error) {
      res.status(500).json(error);
    }
  });

  // Define a route for retrieving files from the database
  app.get("/api/file/:id", authenticate, (req, res) => {
    const fileId = req.params.id;

    // Retrieve the file data from the database
    Uploads.findByPk(fileId)
      .then((file) => {
        if (!file) {
          res.status(404).send("File not found");
        } else {
          // Decompress the file data
          zlib.gunzip(file.content, (err, data) => {
            if (err) {
              console.log(err);
              res.sendStatus(500).json(err);
            } else {
              // Send the file data to the browser
              console.log(data);
              res.send(data);
            }
          });
        }
      })
      .catch((error) => {
        res.status(500).json(error);
      });
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
