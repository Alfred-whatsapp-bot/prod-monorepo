import { buttons } from "../helpers";
//import { getAllMessages } from "../repositories/messageRepository.js";
import { Messages } from "./message.model";
import url from "url";
const { URL } = url;

const myUrl = new URL(import.meta.url);
const store = myUrl.searchParams.get("param");

console.log(store);

const getAllMessages = async (store) => {
  const messages = await Messages.findAll({ where: { session: store } });
  return messages;
};

const messages = await getAllMessages(store);
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
  const filteredObj = Object.fromEntries(
    Object.entries(obj).filter(([key, value]) => value !== null)
  );
  array.push(filteredObj);
}

export default array;
