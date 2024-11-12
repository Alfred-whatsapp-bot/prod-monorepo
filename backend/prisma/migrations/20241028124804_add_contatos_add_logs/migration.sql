-- CreateTable
CREATE TABLE "Contatos" (
    "id" SERIAL NOT NULL,
    "telefone" TEXT NOT NULL,
    "aluno_nome" TEXT NOT NULL,
    "materia_nome" TEXT NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "session" TEXT NOT NULL,

    CONSTRAINT "Contatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogEnvio" (
    "id" SERIAL NOT NULL,
    "dataEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "LogEnvio_pkey" PRIMARY KEY ("id")
);
