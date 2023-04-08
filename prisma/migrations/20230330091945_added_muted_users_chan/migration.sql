-- CreateTable
CREATE TABLE "MutedUserChan" (
    "id" SERIAL NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "untilDate" TIMESTAMP(3) NOT NULL,
    "mutedUserName" TEXT NOT NULL,
    "chanId" INTEGER NOT NULL,
    "userName" TEXT NOT NULL,

    CONSTRAINT "MutedUserChan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MutedUserChan_chanId_mutedUserName_key" ON "MutedUserChan"("chanId", "mutedUserName");

-- AddForeignKey
ALTER TABLE "MutedUserChan" ADD CONSTRAINT "MutedUserChan_userName_fkey" FOREIGN KEY ("userName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MutedUserChan" ADD CONSTRAINT "MutedUserChan_chanId_fkey" FOREIGN KEY ("chanId") REFERENCES "Chan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
