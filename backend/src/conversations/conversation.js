import { PrismaClient } from "@prisma/client";
import { buttons } from "../helpers/helpers.js";

const prisma = new PrismaClient();

const myUrl = new URL(import.meta.url);
const store = myUrl.searchParams.get("param");

const messages = await prisma.message.findMany({
  where: { session: store },
});
const array = [];

for (const message of messages) {
  const buttonsArray = [];

  if (message.buttons) {
    const buttons = message.buttons.split(",");
    for (const button of buttons) {
      buttonsArray.push(button);
    }
  }

  const obj = {
    id: message.message_id ? message.message_id : null,
    parent: message.parent_id ? message.parent_id : 0,
    pattern: new RegExp(message.pattern),
    message: message.text ? message.text : null,
    description: message.description ? message.description : null,
    buttons: message.buttons ? buttons(buttonsArray) : null,
    link: message.link ? message.link : null,
    audio: message.audio ? message.audio : null,
    image: message.image ? message.image : null,
    end: message.end ? message.end : null,
  };
  const filteredObj = Object.fromEntries(Object.entries(obj).filter(([key, value]) => value !== null));
  array.push(filteredObj);
}

export default array;

// import { buttons } from "../helpers/helpers.js";

// /**
//  * Chatbot conversation flow
//  * Example 1
//  */
// export default [
//   {
//     id: 1,
//     parent: 0,
//     pattern: /.*/,
//     message: "Olá! Sou o Alfred 🤖.",
//     description: "Como posso te ajudar?",
//     buttons: buttons([
//       "Site",
//       "Deixe uma menssagem",
//     ]),
//   },
//   {
//     id: 2,
//     parent: 1, // Relation with id: 1
//     pattern: /website/,
//     message: "Visite nosso site!",
//     link: "https://taruma.shop/",
//     end: true,
//   },
//   {
//     id: 3,
//     parent: 1, // Relation with id: 1
//     pattern: /.*deixe.*/,
//     message: "Escreva sua mensagem!",
//   },
//   {
//     id: 7,
//     parent: 6, // Relation with id: 6
//     pattern: /.*/, // Match with all text
//     message: "Obrigado! Atenciosamente, Alfred 🤖 !",
//     end: true,
//   },
// ];
