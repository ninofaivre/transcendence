/*
  Warnings:

  - You are about to drop the `PrivateChan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PublicChan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_privateChan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_publicChan` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Permissions" AS ENUM ('SEND_MESSAGE', 'DELETE_MESSAGE', 'EDIT_TITLE', 'EDIT_PASSWORD', 'EDIT_VISIBILITY', 'INVITE', 'KICK', 'BAN', 'MUTE', 'DESTROY');

-- CreateEnum
CREATE TYPE "ChanType" AS ENUM ('PUBLIC', 'PRIVATE');

-- DropForeignKey
ALTER TABLE "PrivateChan" DROP CONSTRAINT "PrivateChan_discussionId_fkey";

-- DropForeignKey
ALTER TABLE "PublicChan" DROP CONSTRAINT "PublicChan_discussionId_fkey";

-- DropForeignKey
ALTER TABLE "_privateChan" DROP CONSTRAINT "_privateChan_A_fkey";

-- DropForeignKey
ALTER TABLE "_privateChan" DROP CONSTRAINT "_privateChan_B_fkey";

-- DropForeignKey
ALTER TABLE "_publicChan" DROP CONSTRAINT "_publicChan_A_fkey";

-- DropForeignKey
ALTER TABLE "_publicChan" DROP CONSTRAINT "_publicChan_B_fkey";

-- DropTable
DROP TABLE "PrivateChan";

-- DropTable
DROP TABLE "PublicChan";

-- DropTable
DROP TABLE "_privateChan";

-- DropTable
DROP TABLE "_publicChan";

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "permissions" "Permissions"[],
    "chanId" INTEGER NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chan" (
    "id" SERIAL NOT NULL,
    "type" "ChanType" NOT NULL,
    "title" TEXT,
    "password" TEXT,
    "discussionId" INTEGER NOT NULL,
    "userName" TEXT NOT NULL,

    CONSTRAINT "Chan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RoleToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ChanToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Chan_title_key" ON "Chan"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Chan_discussionId_key" ON "Chan"("discussionId");

-- CreateIndex
CREATE UNIQUE INDEX "_RoleToUser_AB_unique" ON "_RoleToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ChanToUser_AB_unique" ON "_ChanToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ChanToUser_B_index" ON "_ChanToUser"("B");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_chanId_fkey" FOREIGN KEY ("chanId") REFERENCES "Chan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chan" ADD CONSTRAINT "Chan_userName_fkey" FOREIGN KEY ("userName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chan" ADD CONSTRAINT "Chan_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChanToUser" ADD CONSTRAINT "_ChanToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Chan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChanToUser" ADD CONSTRAINT "_ChanToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;
