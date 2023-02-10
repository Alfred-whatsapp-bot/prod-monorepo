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

let clientStorage = {};

// export async function stop(name) {
//   const sessPath = `tokens/${name}/session.json`;
//   const sess = fs.existsSync(sessPath)
//     ? JSON.parse(fs.readFileSync(sessPath))
//     : null;

//   sess.status = null;

//   fs.writeFile(sessPath, JSON.stringify(sess), (error) => {
//     if (error) {
//       console.error(`Error writing to ${sessPath}:`, error);
//       return;
//     }
//     console.log(`Emptied value in ${sessPath}`);
//   });

//   if (clientStorage !== null) {
//     let browser;
//     browser = clientStorage.page.browser();
//     browser.close();
//   }
// }

/**
 * Create a chatbot session
 * @param {String} name
 * @param {Array} conversation
 */
export async function session(name, conversation) {
  log("Init", "Starting chatbot...");
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(`tokens/${name}`)) {
      fs.mkdirSync(`tokens/${name}`, { recursive: true });
    }
    fs.writeFileSync(
      `tokens/${name}/qr.json`,
      JSON.stringify({ attempts: 0, base64Qr: "" })
    );
    fs.writeFileSync(
      `tokens/${name}/session.json`,
      JSON.stringify({ session: name, status: "starting" })
    );
    fs.writeFileSync(
      `tokens/${name}/info.json`,
      JSON.stringify({
        id: "",
        formattedTitle: "",
        displayName: "",
        isBusiness: "",
        imgUrl: "",
        wWebVersion: "",
        groups: [],
      })
    );
    fs.writeFileSync(
      `tokens/${name}/connection.json`,
      JSON.stringify({ status: "DISCONNECTED" })
    );
    venom
      .create(
        name,
        (base64Qr, asciiQR, attempts, urlCode) => {
          fs.writeFileSync(
            `tokens/${name}/qr.json`,
            JSON.stringify({ attempts, base64Qr })
          );
        },
        (statusSession, session) => {
          fs.writeFileSync(
            `tokens/${name}/session.json`,
            JSON.stringify({ session: name, status: statusSession })
          );
        },
        venomOptions
      )
      .then(async (client) => {
        await start(client, conversation);
        // const hostDevice = await client.getHostDevice();
        // const me = (await client.getAllContacts()).find((o) => o.isMe);
        // const hostDevice = {
        //   id: { _serialized: me.id._serialized },
        //   formattedTitle: me.name,
        //   displayName: me.pushname,
        //   isBusiness: me.isBusiness,
        //   imgUrl: me.profilePicThumbObj.img,
        // };
        const wWebVersion = await client.getWAVersion();
        const groups = (await client.getAllChats())
          .filter((chat) => chat.isGroup)
          .map((group) => {
            return { id: group.id._serialized, name: group.name };
          });
        setInterval(async () => {
          let status = "DISCONNECTED";
          try {
            status = await client.getConnectionState();
          } catch (error) {}
          fs.writeFileSync(
            `tokens/${name}/connection.json`,
            JSON.stringify({ status })
          );
          fs.writeFileSync(
            `tokens/${name}/info.json`,
            JSON.stringify({
              // id: hostDevice.id._serialized,
              // formattedTitle: hostDevice.formattedTitle,
              // displayName: hostDevice.displayName,
              // isBusiness: hostDevice.isBusiness,
              // imgUrl: hostDevice.imgUrl,
              wWebVersion,
              groups,
            })
          );
        }, 2000);
        clientStorage = client;
        resolve(client);
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

/**
 * Start run listener of whatsapp messages
 * @param {Object} client
 * @param {Array} conversation
 */
export async function start(client, conversation) {
  log(
    "Start",
    `Fluxo de conversação possui (${conversation.length} respostas), \n\n Rodando...`
  );
  try {
    let sessions = [];
    client.onMessage(async (message) => {
      if (!sessions.find((o) => o.from === message.from)) {
        sessions.push({ from: message.from, parent: 0, parents: [] });
      }
      const parent = sessions.find((o) => o.from === message.from).parent;
      const parents = sessions.find((o) => o.from === message.from).parents;
      // const input = message.body ? message.body.toLowerCase() : message.body;
      const media =
        message.isMedia || message.isMMS
          ? {
              buffer: client.decryptFile(message),
              extension: mime.extension(message.mimetype),
            }
          : null;
      const input =
        message.isMedia || message.isMMS
          ? `[media file ${media.extention}]`
          : message.body
          ? message.body.toLowerCase().replace("\n ", "")
          : "[undefined]";
      let replies = conversation.filter(
        (o) =>
          (Array.isArray(o.parent) && o.parent.includes(parent)) ||
          o.parent === parent
      );
      for (const reply of replies) {
        if (reply && message.isGroupMsg === false) {
          if (reply.pattern.test(input)) {
            client.startTyping(message.from);
            log(
              "Recebido",
              `de: ${message.from}, reply_id: ${reply.id}, parent: ${reply.parent}, pattern: ${reply.pattern}, input: ${input}`
            );
            logConversationOnly(
              `Recebido de: ${message.from}`,
              `Mensagem: ${input}`
            );
            sessions
              .find((o) => o.from === message.from)
              .parents.push({ id: reply.id, input: input });
            if (reply.hasOwnProperty("beforeReply")) {
              reply.message = reply.beforeReply(
                message.from,
                input,
                reply.message,
                parents,
                media
              );
            }
            if (reply.hasOwnProperty("beforeForward")) {
              reply.forward = reply.beforeForward(
                message.from,
                reply.forward,
                input,
                parents,
                media
              );
            }
            // TODO: Verifty
            // if (reply.hasOwnProperty("message")) {
            //   reply.message = reply.message.replace(/\$input/g, input);
            // }
            await watchSendLinkPreview(client, message, reply);
            await watchSendButtons(client, message, reply);
            await watchSendImage(client, message, reply);
            await watchSendAudio(client, message, reply);
            await watchSendText(client, message, reply);
            await watchSendList(client, message, reply);
            await watchForward(client, message, reply);
            await watchClose(client, input);
            if (reply.hasOwnProperty("afterReply")) {
              reply.afterReply(message.from, input, parents, media);
            }
            if (reply.hasOwnProperty("end")) {
              if (reply.end) {
                sessions.find((o) => o.from === message.from).parent = 0;
                sessions.find((o) => o.from === message.from).parents = [];
              }
            } else {
              sessions.find((o) => o.from === message.from).parent = reply.id;
              // sessions
              //   .find((o) => o.from === message.from)
              //   .parents.push({ id: reply.id, input: input });
            }
            if (reply.hasOwnProperty("goTo")) {
              let parent = sessions.find((o) => o.from === message.from).parent;
              let id = reply.goTo(
                message.from,
                input,
                reply.message,
                parents,
                media
              );
              parent = parent ? id - 1 : null;
              if (parent) {
                sessions.find((o) => o.from === message.from).parent = parent;
              }
            }
            client.stopTyping(message.from);
          }
        }
      }
    });
  } catch (err) {
    client.close();
    error(err);
  }
}

/**
 * Close session
 * @param {Object} client
 * @param {Object} message
 * @param {Object} reply
 */
async function watchClose(client, input) {
  if (input === "fechar") {
    await client.close();
  }
}

/**
 * Send link preview
 * @param {Object} client
 * @param {Object} message
 * @param {Object} reply
 */
async function watchSendLinkPreview(client, message, reply) {
  if (reply.hasOwnProperty("link") && reply.hasOwnProperty("message")) {
    await client
      .sendLinkPreview(message.from, reply.link, reply.message)
      .then((result) =>
        logConversationOnly(
          "Send",
          `(sendLinkPreview): ${reply.message.substring(0, 40)}...`
        )
      )
      .catch((err) => error(`(sendLinkPreview): ${err}`));
  }
}

/**
 * Send buttons
 * @param {Object} client
 * @param {Object} message
 * @param {Object} reply
 */
async function watchSendButtons(client, message, reply) {
  if (
    reply.hasOwnProperty("buttons") &&
    reply.hasOwnProperty("description") &&
    reply.hasOwnProperty("message")
  ) {
    await client
      .sendButtons(
        message.from,
        reply.message,
        reply.buttons,
        reply.description
      )
      .then((result) =>
        logConversationOnly(
          "Send",
          `(sendButtons): ${reply.message.substring(0, 40)}...`
        )
      )
      .catch((err) => error("(sendButtons):", err));
  }
}

/**
 * Send image file (jpg, png, gif)
 * @param {Object} client
 * @param {Object} message
 * @param {Object} reply
 */
async function watchSendImage(client, message, reply) {
  if (reply.hasOwnProperty("image")) {
    if (
      reply.image.hasOwnProperty("base64") &&
      reply.image.hasOwnProperty("filename")
    ) {
      await client
        .sendImageFromBase64(
          message.from,
          reply.image.base64,
          reply.image.filename
        )
        .then((result) =>
          logConversationOnly(
            "Send",
            `(sendImage b64): ${reply.image.filename}`
          )
        )
        .catch((err) => error("(sendImage b64):", err));
    } else {
      const filename = reply.image.split("/").pop();
      await client
        .sendImage(message.from, reply.image, filename, "")
        .then((result) =>
          logConversationOnly("Send", `(sendImage): ${reply.image}`)
        )
        .catch((err) => error("(sendImage):", err));
    }
  }
}

/**
 * Send audio file MP3
 * @param {Object} client
 * @param {Object} message
 * @param {Object} reply
 */
async function watchSendAudio(client, message, reply) {
  if (reply.hasOwnProperty("audio")) {
    if (
      reply.audio.hasOwnProperty("base64") &&
      reply.audio.hasOwnProperty("filename")
    ) {
      await client
        .sendVoiceBase64(message.from, reply.audio.base64)
        .then((result) =>
          logConversationOnly(
            "Send",
            `(sendAudio b64): ${reply.audio.filename}`
          )
        )
        .catch((err) => error("(sendAudio b64):", err));
    } else {
      await client
        .sendVoice(message.from, reply.audio)
        .then((result) =>
          logConversationOnly("Send", `(sendAudio): ${reply.audio}`)
        )
        .catch((err) => error("(sendAudio):", err));
    }
  }
}

/**
 * Send simple text
 * @param {Object} client
 * @param {Object} message
 * @param {Object} reply
 */
async function watchSendText(client, message, reply) {
  if (
    !reply.hasOwnProperty("link") &&
    !reply.hasOwnProperty("buttons") &&
    !reply.hasOwnProperty("description") &&
    reply.hasOwnProperty("message")
  ) {
    await client
      .sendText(message.from, reply.message)
      .then((result) =>
        logConversationOnly(
          "Send",
          `(sendText): ${reply.message.substring(0, 40)}...`
        )
      )
      .catch((err) => error("(sendText):", err));
  }
}

/**
 * Send menu list
 * @param {Object} client
 * @param {Object} message
 * @param {Object} reply
 */
async function watchSendList(client, message, reply) {
  if (
    reply.hasOwnProperty("list") &&
    reply.hasOwnProperty("description") &&
    reply.hasOwnProperty("message")
  ) {
    await client
      .sendListMenu(
        message.from,
        reply.message,
        reply.description,
        reply.button,
        reply.list
      )
      .then((result) =>
        logConversationOnly(
          "Send",
          `(sendList): ${reply.message.substring(0, 40)}...`
        )
      )
      .catch((err) => error("(sendList):", err));
  }
}

/**
 * Forward message
 * @param {Object} client
 * @param {Object} message
 * @param {Object} reply
 */
async function watchForward(client, message, reply) {
  if (reply.hasOwnProperty("forward") && reply.hasOwnProperty("message")) {
    // await client
    //   .forwardMessages(reply.forward, [message.id.toString()], true)
    //   .then((result) =>
    //     log("Send", `(forward): ${reply.message.substring(0, 40)}...`)
    //   )
    //   .catch((err) => error("(forward):", err));

    await client
      .sendText(reply.forward, reply.message)
      .then((result) =>
        logConversationOnly(
          "Send",
          `(forward): to: ${reply.forward} : ${reply.message.substring(
            0,
            40
          )}...`
        )
      )
      .catch((err) => error("(forward):", err));

    // /* Debug */
    // console.log("--- DEBUG --- forward", reply.forward);
    // await client
    //   .sendText(message.from, "--- DEBUG --- forward: " + reply.forward)
    //   .then((result) =>
    //     log("Send", `(DEBUG : forward): ${reply.message.substring(0, 40)}...`)
    //   )
    //   .catch((err) => error("(DEBUG : forward):", err));
  }
}

/**
 * Logging debug
 * @param {String} type
 * @param {String} message
 */
export function log(type, message) {
  const datetime = new Date().toLocaleString();
  const msg = `[${datetime}] [${type}] ${message.replace(/\n/g, " ")}`;
  console.log(msg);
  if (!fs.existsSync("logs")) {
    fs.mkdirSync("logs", { recursive: true });
    fs.writeFileSync("logs/logs.log", "");
  }
  fs.appendFileSync("logs/logs.log", msg + "\n", "utf8");
}

/**
 * Logging debug
 * @param {String} type
 * @param {String} message
 */
export function logConversationOnly(type, message) {
  const datetime = new Date().toLocaleString();
  const msg = `[${datetime}] [${type}] ${message.replace(/\n/g, " ")}`;
  console.log(msg);
  if (!fs.existsSync("logs")) {
    fs.mkdirSync("logs", { recursive: true });
    fs.writeFileSync("logs/conversations.log", "");
  }
  fs.appendFileSync("logs/conversations.log", msg + "\n", "utf8");
}

/**
 * Logging error
 * @param {String} message
 */
export function error(message, err) {
  const datetime = new Date().toLocaleString();
  const msg = `[${datetime}] [Error] ${message.replace(/\n/g, " ")}`;
  console.error(msg);
  console.error(err);
  if (!fs.existsSync("logs")) {
    fs.mkdirSync("logs", { recursive: true });
    fs.writeFileSync("logs/logs.log", "");
  }
  fs.appendFileSync("logs/logs.log", msg + " " + err.status + "\n", "utf8");
}

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
  app.use("/index", function (req, res) {
    res.status(200).send("App is running.");
  });
  const authenticate = async (req, res, next) => {
    let authorized = false;
    const tokenCheck = req.headers["authorization"];
    const { email, senha } = req.body;

    if (tokenCheck) {
      try {
        const authToken = tokenCheck.split(" ")[1];
        const decoded = jwt.verify(authToken, process.env.TOKEN_KEY);
        if (decoded) {
          authorized = true;
          req.email = decoded;
          //res.status(200).json(decoded.email);
          next();
          return authorized;
        }
      } catch (error) {
        res.status(403).send(error);
      }
    }

    if (email && senha) {
      try {
        const user = await Users.findOne({ where: { email: email } });
        if (user && (await bcrypt.compare(senha, user.senha))) {
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
          await user.save();
          // user
          res.status(200).json(user);
          authorized = true;
          return authorized;
        }
      } catch (e) {
        res.status(500).send(e);
      }
    }
  };
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
  app.get("/api/connection", authenticate, async (req, res, next) => {
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
  app.post("/api/pedidos/create", (req, res, next) => {
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
  app.post("/api/register", async (req, res) => {
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
