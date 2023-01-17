import { Messages } from "../models/message.model.js";

export const getAllMessages = async () => {
  const messages = await Messages.findAll();
  console.log(messages);
  return messages;
};
