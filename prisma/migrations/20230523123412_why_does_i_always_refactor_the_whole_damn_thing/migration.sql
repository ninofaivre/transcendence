/*
  Warnings:

  - You are about to drop the `DiscussionElement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DiscussionEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DiscussionMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DiscussionMessageToRole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DiscussionMessageToUser` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `discussionEventId` on table `ChanInvitation` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "DmEventType" AS ENUM ('CREATED_FRIENDSHIP', 'DELETED_FRIENDSHIP', 'DELETED_MESSAGE', 'CHAN_INVITATION');

-- CreateEnum
CREATE TYPE "ChanEventType" AS ENUM ('AUTHOR_LEAVED', 'AUTHOR_KICKED_CONCERNED', 'AUTHOR_JOINED', 'AUTHOR_MUTED_CONCERNED', 'DELETED_MESSAGE');

-- DropForeignKey
ALTER TABLE "DiscussionElement" DROP CONSTRAINT "DiscussionElement_author_fkey";

-- DropForeignKey
ALTER TABLE "DiscussionElement" DROP CONSTRAINT "DiscussionElement_chanId_fkey";

-- DropForeignKey
ALTER TABLE "DiscussionElement" DROP CONSTRAINT "DiscussionElement_directMessageId_fkey";

-- DropForeignKey
ALTER TABLE "DiscussionEvent" DROP CONSTRAINT "DiscussionEvent_ChanInvitationId_fkey";

-- DropForeignKey
ALTER TABLE "DiscussionEvent" DROP CONSTRAINT "DiscussionEvent_chanInvitationRelatedTitle_fkey";

-- DropForeignKey
ALTER TABLE "DiscussionEvent" DROP CONSTRAINT "DiscussionEvent_concernedUser_fkey";

-- DropForeignKey
ALTER TABLE "DiscussionEvent" DROP CONSTRAINT "DiscussionEvent_discussionElementId_fkey";

-- DropForeignKey
ALTER TABLE "DiscussionMessage" DROP CONSTRAINT "DiscussionMessage_discussionElementId_fkey";

-- DropForeignKey
ALTER TABLE "DiscussionMessage" DROP CONSTRAINT "DiscussionMessage_relatedTo_fkey";

-- DropForeignKey
ALTER TABLE "_DiscussionMessageToRole" DROP CONSTRAINT "_DiscussionMessageToRole_A_fkey";

-- DropForeignKey
ALTER TABLE "_DiscussionMessageToRole" DROP CONSTRAINT "_DiscussionMessageToRole_B_fkey";

-- DropForeignKey
ALTER TABLE "_DiscussionMessageToUser" DROP CONSTRAINT "_DiscussionMessageToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_DiscussionMessageToUser" DROP CONSTRAINT "_DiscussionMessageToUser_B_fkey";

-- AlterTable
ALTER TABLE "ChanInvitation" ALTER COLUMN "discussionEventId" SET NOT NULL;

-- DropTable
DROP TABLE "DiscussionElement";

-- DropTable
DROP TABLE "DiscussionEvent";

-- DropTable
DROP TABLE "DiscussionMessage";

-- DropTable
DROP TABLE "_DiscussionMessageToRole";

-- DropTable
DROP TABLE "_DiscussionMessageToUser";

-- DropEnum
DROP TYPE "EventType";

-- CreateTable
CREATE TABLE "DmDiscussionElement" (
    "id" SERIAL NOT NULL,
    "author" TEXT NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificationDate" TIMESTAMP(3),
    "directMessageId" INTEGER NOT NULL,

    CONSTRAINT "DmDiscussionElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DmDiscussionMessage" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "relatedTo" INTEGER,
    "discussionElementId" INTEGER NOT NULL,

    CONSTRAINT "DmDiscussionMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DmDiscussionEvent" (
    "id" SERIAL NOT NULL,
    "eventType" "DmEventType" NOT NULL,
    "discussionElementId" INTEGER NOT NULL,

    CONSTRAINT "DmDiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChanDiscussionElement" (
    "id" SERIAL NOT NULL,
    "author" TEXT NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificationDate" TIMESTAMP(3),
    "chanId" INTEGER NOT NULL,

    CONSTRAINT "ChanDiscussionElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChanDiscussionMessage" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "relatedTo" INTEGER,
    "discussionElementId" INTEGER NOT NULL,

    CONSTRAINT "ChanDiscussionMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChanDiscussionEvent" (
    "id" SERIAL NOT NULL,
    "eventType" "ChanEventType" NOT NULL,
    "concernedUser" TEXT,
    "discussionElementId" INTEGER NOT NULL,

    CONSTRAINT "ChanDiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DmDiscussionMessageToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ChanDiscussionMessageToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ChanDiscussionMessageToRole" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DmDiscussionMessage_discussionElementId_key" ON "DmDiscussionMessage"("discussionElementId");

-- CreateIndex
CREATE UNIQUE INDEX "DmDiscussionEvent_discussionElementId_key" ON "DmDiscussionEvent"("discussionElementId");

-- CreateIndex
CREATE UNIQUE INDEX "ChanDiscussionMessage_discussionElementId_key" ON "ChanDiscussionMessage"("discussionElementId");

-- CreateIndex
CREATE UNIQUE INDEX "ChanDiscussionEvent_discussionElementId_key" ON "ChanDiscussionEvent"("discussionElementId");

-- CreateIndex
CREATE UNIQUE INDEX "_DmDiscussionMessageToUser_AB_unique" ON "_DmDiscussionMessageToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_DmDiscussionMessageToUser_B_index" ON "_DmDiscussionMessageToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ChanDiscussionMessageToUser_AB_unique" ON "_ChanDiscussionMessageToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ChanDiscussionMessageToUser_B_index" ON "_ChanDiscussionMessageToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ChanDiscussionMessageToRole_AB_unique" ON "_ChanDiscussionMessageToRole"("A", "B");

-- CreateIndex
CREATE INDEX "_ChanDiscussionMessageToRole_B_index" ON "_ChanDiscussionMessageToRole"("B");

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_discussionEventId_fkey" FOREIGN KEY ("discussionEventId") REFERENCES "DmDiscussionEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionElement" ADD CONSTRAINT "DmDiscussionElement_author_fkey" FOREIGN KEY ("author") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionElement" ADD CONSTRAINT "DmDiscussionElement_directMessageId_fkey" FOREIGN KEY ("directMessageId") REFERENCES "DirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionMessage" ADD CONSTRAINT "DmDiscussionMessage_relatedTo_fkey" FOREIGN KEY ("relatedTo") REFERENCES "DmDiscussionElement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionMessage" ADD CONSTRAINT "DmDiscussionMessage_discussionElementId_fkey" FOREIGN KEY ("discussionElementId") REFERENCES "DmDiscussionElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionEvent" ADD CONSTRAINT "DmDiscussionEvent_discussionElementId_fkey" FOREIGN KEY ("discussionElementId") REFERENCES "DmDiscussionElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionElement" ADD CONSTRAINT "ChanDiscussionElement_author_fkey" FOREIGN KEY ("author") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionElement" ADD CONSTRAINT "ChanDiscussionElement_chanId_fkey" FOREIGN KEY ("chanId") REFERENCES "Chan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionMessage" ADD CONSTRAINT "ChanDiscussionMessage_relatedTo_fkey" FOREIGN KEY ("relatedTo") REFERENCES "ChanDiscussionElement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionMessage" ADD CONSTRAINT "ChanDiscussionMessage_discussionElementId_fkey" FOREIGN KEY ("discussionElementId") REFERENCES "ChanDiscussionElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionEvent" ADD CONSTRAINT "ChanDiscussionEvent_concernedUser_fkey" FOREIGN KEY ("concernedUser") REFERENCES "User"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionEvent" ADD CONSTRAINT "ChanDiscussionEvent_discussionElementId_fkey" FOREIGN KEY ("discussionElementId") REFERENCES "ChanDiscussionElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DmDiscussionMessageToUser" ADD CONSTRAINT "_DmDiscussionMessageToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "DmDiscussionMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DmDiscussionMessageToUser" ADD CONSTRAINT "_DmDiscussionMessageToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChanDiscussionMessageToUser" ADD CONSTRAINT "_ChanDiscussionMessageToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "ChanDiscussionMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChanDiscussionMessageToUser" ADD CONSTRAINT "_ChanDiscussionMessageToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChanDiscussionMessageToRole" ADD CONSTRAINT "_ChanDiscussionMessageToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "ChanDiscussionMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChanDiscussionMessageToRole" ADD CONSTRAINT "_ChanDiscussionMessageToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
