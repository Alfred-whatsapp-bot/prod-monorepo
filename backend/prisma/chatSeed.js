import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.message.createMany({
    data: [
      {
        message_id: 1,
        parent_id: null,
        pattern: ".*",
        text: "Olá! Sou o Alfred 🤖.",
        description: "Como posso te ajudar?",
        buttons: null,
        link: null,
        audio: null,
        image: null,
        end: false,
        session: "default",
      },
      {
        message_id: 2,
        parent_id: 1,
        pattern: "website",
        text: "Visite nosso site!",
        description: null,
        buttons: null,
        link: "https://taruma.shop/",
        audio: null,
        image: null,
        end: true,
        session: "default",
      },
      {
        message_id: 3,
        parent_id: 1,
        pattern: "deixe",
        text: "Escreva sua mensagem!",
        description: null,
        buttons: null,
        link: null,
        audio: null,
        image: null,
        end: false,
        session: "default",
      },
      {
        message_id: 4,
        parent_id: 3,
        pattern: ".*",
        text: "Obrigado! Atenciosamente, Alfred 🤖 !",
        description: null,
        buttons: null,
        link: null,
        audio: null,
        image: null,
        end: true,
        session: "default",
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
