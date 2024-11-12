-- CreateTable
CREATE TABLE "Message" (
    "message_id" SERIAL NOT NULL,
    "parent_id" INTEGER,
    "pattern" TEXT,
    "text" TEXT,
    "description" TEXT,
    "buttons" TEXT,
    "link" TEXT,
    "audio" TEXT,
    "image" TEXT,
    "end" BOOLEAN,
    "session" TEXT,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("message_id")
);

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Message"("message_id") ON DELETE SET NULL ON UPDATE CASCADE;
