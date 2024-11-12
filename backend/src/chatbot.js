import venom from "venom-bot";
import { venomOptions } from "./config.js";
import fs from "fs";
import { createRequire } from "module";
import mime from "mime-types";
import * as path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

let clientStorage;
let timeoutId;

function closeFileDescriptor(filePath) {
  return new Promise((resolve, reject) => {
    fs.open(filePath, "r", (err, fd) => {
      if (err) {
        if (err.code === "EBUSY") {
          resolve();
        } else {
          reject(err);
        }
      } else {
        fs.close(fd, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }
    });
  });
}

function deleteFile(filePath, retries = 5, delay = 1000) {
  return new Promise((resolve, reject) => {
    const attemptDelete = async (attempt) => {
      try {
        await closeFileDescriptor(filePath);
        fs.unlink(filePath, (err) => {
          if (err) {
            if (err.code === "EBUSY" && attempt < retries) {
              console.log(`Retrying to delete file: ${filePath} (Attempt ${attempt + 1})`);
              setTimeout(() => attemptDelete(attempt + 1), delay);
            } else {
              reject(err);
            }
          } else {
            resolve();
          }
        });
      } catch (err) {
        if (attempt < retries) {
          console.log(`Retrying to close file descriptor: ${filePath} (Attempt ${attempt + 1})`);
          setTimeout(() => attemptDelete(attempt + 1), delay);
        } else {
          reject(err);
        }
      }
    };

    attemptDelete(0);
  });
}

export async function stop(name) {
  const tokensDir = path.join(__dirname, `../tokens/${name}`);
  if (fs.existsSync(tokensDir)) {
    fs.readdir(tokensDir, (err, files) => {
      if (err) console.log(err);

      for (const file of files) {
        // deleteFile(filePath)
        //   .then(() => {
        //     console.log("File deleted successfully");
        //   })
        //   .catch((err) => {
        //     console.error("Failed to delete file:", err);
        //   });
        fs.rm(path.join(tokensDir, file), { recursive: true, force: true }, (err) => {
          if (err) console.log(err);
        });
      }
    });
  }

  // const sessPath = `tokens/${name}/session.json`;
  // const sess = fs.existsSync(sessPath) ? JSON.parse(fs.readFileSync(sessPath)) : null;

  // const connectPath = `tokens/${name}/connection.json`;
  // const connection = fs.existsSync(connectPath) ? JSON.parse(fs.readFileSync(connectPath)) : null;

  // connection.status = null;
  // sess.status = null;

  // fs.writeFile(connectPath, JSON.stringify(connection), (error) => {
  //   if (error) {
  //     console.error(`Error writing to ${connectPath}:`, error);
  //     return;
  //   }
  //   console.log(`Emptied value in ${connectPath}`);
  // });

  // fs.writeFile(sessPath, JSON.stringify(sess), (error) => {
  //   if (error) {
  //     console.error(`Error writing to ${sessPath}:`, error);
  //     return;
  //   }
  //   console.log(`Emptied value in ${sessPath}`);
  // });

  // if (clientStorage !== null) {
  //   console.log('clientStorage: ', clientStorage);
  //   let browser;
  //   browser = clientStorage.page.browser();
  //   browser.close();
  // }
}

export async function restart(name) {
  await Promise.all([stop(name), session(name)]);
}

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
    fs.writeFileSync(`tokens/${name}/qr.json`, JSON.stringify({ attempts: 0, base64Qr: "" }));
    fs.writeFileSync(`tokens/${name}/session.json`, JSON.stringify({ session: name, status: "starting" }));
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
    fs.writeFileSync(`tokens/${name}/connection.json`, JSON.stringify({ status: "DISCONNECTED" }));
    clientStorage = venom
      .create(
        name,
        (base64Qr, asciiQR, attempts, urlCode) => {
          fs.writeFileSync(`tokens/${name}/qr.json`, JSON.stringify({ attempts, base64Qr }));
        },
        (statusSession, session) => {
          fs.writeFileSync(`tokens/${name}/session.json`, JSON.stringify({ session: name, status: statusSession }));
        },
        venomOptions
      )
      .then(async (client) => {
        // Clear the timeout if the client is initialized successfully
        clearTimeout(timeoutId);
        //await start(client, conversation);
        const hostDevice = await client.getHostDevice();
        //const me = (await client.getAllContacts()).find((o) => o.isMe);
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
          fs.writeFileSync(`tokens/${name}/connection.json`, JSON.stringify({ status }));
          fs.writeFileSync(
            `tokens/${name}/info.json`,
            JSON.stringify({
              id: hostDevice.id._serialized,
              formattedTitle: hostDevice.formattedTitle,
              displayName: hostDevice.displayName,
              isBusiness: hostDevice.isBusiness,
              imgUrl: hostDevice.imgUrl,
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

    monitorClientState(name);
  });
}

function monitorClientState(name) {
  // function to detect conflits and change status
  // Force it to keep the current session
  // Possible state values:
  // CONFLICT
  // CONNECTED
  // DEPRECATED_VERSION
  // OPENING
  // PAIRING
  // PROXYBLOCK
  // SMB_TOS_BLOCK
  // TIMEOUT
  // TOS_BLOCK
  // UNLAUNCHED
  // UNPAIRED
  // UNPAIRED_IDLE
  clientStorage.onStateChange((state) => {
    console.log("State changed: ", state);
    // force whatsapp take over
    if ("CONFLICT".includes(state)) clientStorage.useHere();
    // detect disconnect on whatsapp
    if ("UNPAIRED".includes(state)) console.log("logout");
  });

  // DISCONNECTED
  // SYNCING
  // RESUMING
  // CONNECTED
  let time = 0;
  clientStorage.onStreamChange((state) => {
    console.log("State Connection Stream: " + state);
    clearTimeout(time);
    if (state === "DISCONNECTED" || state === "SYNCING") {
      time = setTimeout(() => {
        clientStorage.close();
      }, 80000);
    }
  });

  // function to detect incoming call
  clientStorage.onIncomingCall(async (call) => {
    console.log(call);
    clientStorage.sendText(call.peerJid, "Sorry, I still can't answer calls");
  });
}

async function restartClient(name) {
  try {
    if (clientStorage) {
      await clientStorage.logout();
    }
    await session(name);
  } catch (error) {
    console.error("Error restarting client:", error);
  }
}

/**
 * Send message to all contacts
 * @param {String} session
 */
export async function sendMessageEmMassa(session) {
  if (!clientStorage) {
    throw new Error("Client is not initialized");
  }

  const contacts = await prisma.contatos.findMany({
    where: {
      session: session,
    },
  });

  try {
    await sendMessagesWithDelay(clientStorage, contacts, session);
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Send message to single contact
 * @param {String} session
 */
export async function sendMessageByContact(session, contacts) {
  if (!clientStorage) {
    throw new Error("Client is not initialized");
  }

  try {
    const contatos = await prisma.contatos.findMany({
      where: {
        telefone: {
          in: contacts,
        },
      },
    });

    await sendMessagesWithDelay(clientStorage, contatos, session);
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Envia mensagens para uma lista de contatos com um pequeno atraso entre cada envio
 * @param {Object} clientStorage - Cliente do Venom-Bot
 * @param {Array} contacts - Lista de contatos
 * @param {String} message - Mensagem a ser enviada
 */
export async function sendMessagesWithDelay(clientStorage, contacts, session) {
  const message = await prisma.message.findFirst({
    where: {
      session: session,
    },
  });
  const usuario = await prisma.usuarios.findFirst({
    where: {
      email: session,
    },
  });

  // Agrupar contatos por número de telefone
  const contactsByPhone = contacts.reduce((acc, contact) => {
    if (!acc[contact.telefone]) {
      acc[contact.telefone] = {
        responsavelNome: contact.responsavel_nome,
        children: [],
      };
    }
    if (!acc[contact.telefone].children[contact.aluno_nome]) {
      acc[contact.telefone].children[contact.aluno_nome] = [];
    }
    acc[contact.telefone].children[contact.aluno_nome].push(contact);
    return acc;
  }, {});

  // Enviar mensagem para cada responsável
  for (const [phoneNumber, { responsavelNome, children }] of Object.entries(contactsByPhone)) {
    let childrenInfo = "";
    for (const [alunoNome, alunoContacts] of Object.entries(children)) {
      childrenInfo += `- *${alunoNome}*:\n`;
      for (const contact of alunoContacts) {
        if (contact.materia_nome)
          for (const subject of contact.materia_nome.split(",")) {
            childrenInfo += `  - ${subject.trim()} - ${contact.avaliacao_nome}: ${contact.nota}\n`;
          }
      }
    }

    console.log("usuario: ", usuario);
    const finalMessage = message.text.replace("[NOME_RESPONSAVEL]", responsavelNome).replace("[CHILDREN_INFO]", childrenInfo).replace("[ESCOLA_NOME]", usuario.nome);

    // Envia a mensagem para o número de telefone
    await sendMessageFunction(clientStorage, phoneNumber, finalMessage);

    // Aguarda 2 segundos antes de enviar a próxima mensagem
    await delay(2000);
  }
}

const sendMessageFunction = async (client, phoneNumber, message) => {
  await client.sendText("55" + phoneNumber + "@c.us", message).then(async (result) => {
    if (result.status.messageSendResult === "OK") {
      await prisma.logEnvio.create({
        data: {
          telefone: phoneNumber,
          status: "OK",
        },
      });

      return true;
    }

    if (result.status.messageSendResult === "ERROR") {
      await prisma.logEnvio.create({
        data: {
          telefone: phoneNumber,
          status: "ERROR",
        },
      });

      return false;
    }
  });
};

/**
 * Start run listener of whatsapp messages
 * @param {Object} client
 * @param {Array} conversation
 */
export async function start(client, conversation) {
  log("Start", `Fluxo de conversação possui (${conversation.length} respostas), \n\n Rodando...`);
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
      const input = message.isMedia || message.isMMS ? `[media file ${media.extention}]` : message.body ? message.body.toLowerCase().replace("\n ", "") : "[undefined]";
      let replies = conversation.filter((o) => (Array.isArray(o.parent) && o.parent.includes(parent)) || o.parent === parent);
      for (const reply of replies) {
        if (reply && message.isGroupMsg === false) {
          if (reply.pattern.test(input)) {
            client.startTyping(message.from);
            log("Recebido", `de: ${message.from}, reply_id: ${reply.id}, parent: ${reply.parent}, pattern: ${reply.pattern}, input: ${input}`);
            logConversationOnly(`Recebido de: ${message.from}`, `Mensagem: ${input}`);
            sessions.find((o) => o.from === message.from).parents.push({ id: reply.id, input: input });
            if (reply.hasOwnProperty("beforeReply")) {
              reply.message = reply.beforeReply(message.from, input, reply.message, parents, media);
            }
            if (reply.hasOwnProperty("beforeForward")) {
              reply.forward = reply.beforeForward(message.from, reply.forward, input, parents, media);
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
              let id = reply.goTo(message.from, input, reply.message, parents, media);
              parent = parent ? id - 1 : null;
              if (parent) {
                sessions.find((o) => o.from === message.from).parent = parent;
              }
            }
            //client.stopTyping(message.from);
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
      .then((result) => logConversationOnly("Send", `(sendLinkPreview): ${reply.message.substring(0, 40)}...`))
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
  if (reply.hasOwnProperty("buttons") && reply.hasOwnProperty("description") && reply.hasOwnProperty("message")) {
    await client
      .sendButtons(message.from, reply.message, reply.buttons, reply.description)
      .then((result) => logConversationOnly("Send", `(sendButtons): ${reply.message.substring(0, 40)}...`))
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
    if (reply.image.hasOwnProperty("base64") && reply.image.hasOwnProperty("filename")) {
      await client
        .sendImageFromBase64(message.from, reply.image.base64, reply.image.filename)
        .then((result) => logConversationOnly("Send", `(sendImage b64): ${reply.image.filename}`))
        .catch((err) => error("(sendImage b64):", err));
    } else {
      const filename = reply.image.split("/").pop();
      await client
        .sendImage(message.from, reply.image, filename, "")
        .then((result) => logConversationOnly("Send", `(sendImage): ${reply.image}`))
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
    if (reply.audio.hasOwnProperty("base64") && reply.audio.hasOwnProperty("filename")) {
      await client
        .sendVoiceBase64(message.from, reply.audio.base64)
        .then((result) => logConversationOnly("Send", `(sendAudio b64): ${reply.audio.filename}`))
        .catch((err) => error("(sendAudio b64):", err));
    } else {
      await client
        .sendVoice(message.from, reply.audio)
        .then((result) => logConversationOnly("Send", `(sendAudio): ${reply.audio}`))
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
  if (!reply.hasOwnProperty("link") && !reply.hasOwnProperty("buttons") && !reply.hasOwnProperty("description") && reply.hasOwnProperty("message")) {
    await client
      .sendText(message.from, reply.message)
      .then((result) => logConversationOnly("Send", `(sendText): ${reply.message.substring(0, 40)}...`))
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
  if (reply.hasOwnProperty("list") && reply.hasOwnProperty("description") && reply.hasOwnProperty("message")) {
    await client
      .sendListMenu(message.from, reply.message, reply.description, reply.button, reply.list)
      .then((result) => logConversationOnly("Send", `(sendList): ${reply.message.substring(0, 40)}...`))
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
      .then((result) => logConversationOnly("Send", `(forward): to: ${reply.forward} : ${reply.message.substring(0, 40)}...`))
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
 * Função de atraso
 * @param {number} ms - Milissegundos para esperar
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Catch ctrl+C
process.on("SIGINT", function () {
  clientStorage.close();
});
