import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.usuarios.create({
    data: {
      nome: "Admin",
      email: "admin@example.com",
      senha: "admin123",
      token: "initialToken",
    },
  });

  await prisma.usuarios.create({
    data: {
      nome: "User1",
      email: "user1@example.com",
      senha: "user123",
      token: null,
    },
  });

  await prisma.usuarios.create({
    data: {
      nome: "User2",
      email: "user2@example.com",
      senha: "user123",
      token: null,
    },
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
