import { buttons } from "../helpers";

/**
 * Chatbot conversation flow
 * Example 1
 */
export default [
  {
    id: 1,
    parent: 0,
    pattern: /.*/,
    message: "Olá! Sou o Alfred 2🤖.",
  },
  {
    id: 2,
    parent: 1, // Relation with id: 1
    pattern: /website/,
    message: "Visite nosso site!",
    link: "https://taruma.shop/",
    end: true,
  },
  {
    id: 3,
    parent: 1, // Relation with id: 1
    pattern: /deixe/,
    message: "Escreva sua mensagem!",
  },
  {
    id: 7,
    parent: 6, // Relation with id: 6
    pattern: /.*/, // Match with all text
    message: "Obrigado! Atenciosamente, Alfred 2🤖 !",
    end: true,
  },
];
