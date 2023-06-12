/*
  Warnings:

  - You are about to drop the column `discussionElementId` on the `ChanDiscussionEvent` table. All the data in the column will be lost.
  - You are about to drop the column `discussionElementId` on the `ChanDiscussionMessage` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[messageId]` on the table `ChanDiscussionElement` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[eventId]` on the table `ChanDiscussionElement` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ChanDiscussionEvent" DROP CONSTRAINT "ChanDiscussionEvent_discussionElementId_fkey";

-- DropForeignKey
ALTER TABLE "ChanDiscussionMessage" DROP CONSTRAINT "ChanDiscussionMessage_discussionElementId_fkey";

-- DropIndex
DROP INDEX "ChanDiscussionEvent_discussionElementId_key";

-- DropIndex
DROP INDEX "ChanDiscussionMessage_discussionElementId_key";

-- AlterTable
ALTER TABLE "ChanDiscussionElement" ADD COLUMN     "eventId" TEXT,
ADD COLUMN     "messageId" TEXT;

-- AlterTable
ALTER TABLE "ChanDiscussionEvent" DROP COLUMN "discussionElementId";

-- AlterTable
ALTER TABLE "ChanDiscussionMessage" DROP COLUMN "discussionElementId";

-- CreateIndex
CREATE UNIQUE INDEX "ChanDiscussionElement_messageId_key" ON "ChanDiscussionElement"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "ChanDiscussionElement_eventId_key" ON "ChanDiscussionElement"("eventId");

-- AddForeignKey
ALTER TABLE "ChanDiscussionElement" ADD CONSTRAINT "ChanDiscussionElement_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChanDiscussionMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionElement" ADD CONSTRAINT "ChanDiscussionElement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ChanDiscussionEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
