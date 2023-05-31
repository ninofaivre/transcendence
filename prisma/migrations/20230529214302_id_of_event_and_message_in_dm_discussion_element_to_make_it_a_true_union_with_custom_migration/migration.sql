/*
  Warnings:

  - You are about to drop the column `author` on the `ChanDiscussionElement` table. All the data in the column will be lost.
  - You are about to drop the column `discussionElementId` on the `DmDiscussionEvent` table. All the data in the column will be lost.
  - You are about to drop the column `discussionElementId` on the `DmDiscussionMessage` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[messageId]` on the table `DmDiscussionElement` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[eventId]` on the table `DmDiscussionElement` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `authorName` to the `ChanDiscussionElement` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChanDiscussionElement" DROP CONSTRAINT "ChanDiscussionElement_author_fkey";

-- DropForeignKey
ALTER TABLE "DmDiscussionEvent" DROP CONSTRAINT "DmDiscussionEvent_discussionElementId_fkey";

-- DropForeignKey
ALTER TABLE "DmDiscussionMessage" DROP CONSTRAINT "DmDiscussionMessage_discussionElementId_fkey";

-- DropIndex
DROP INDEX "DmDiscussionEvent_discussionElementId_key";

-- DropIndex
DROP INDEX "DmDiscussionMessage_discussionElementId_key";

-- AlterTable
ALTER TABLE "ChanDiscussionElement" DROP COLUMN "author",
ADD COLUMN     "authorName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DmDiscussionElement" ADD COLUMN     "eventId" TEXT,
ADD COLUMN     "messageId" TEXT;

-- AlterTable
ALTER TABLE "DmDiscussionEvent" DROP COLUMN "discussionElementId";

-- AlterTable
ALTER TABLE "DmDiscussionMessage" DROP COLUMN "discussionElementId";

-- CreateIndex
CREATE UNIQUE INDEX "DmDiscussionElement_messageId_key" ON "DmDiscussionElement"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "DmDiscussionElement_eventId_key" ON "DmDiscussionElement"("eventId");

-- AddForeignKey
ALTER TABLE "DmDiscussionElement" ADD CONSTRAINT "DmDiscussionElement_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "DmDiscussionMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionElement" ADD CONSTRAINT "DmDiscussionElement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "DmDiscussionEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionElement" ADD CONSTRAINT "ChanDiscussionElement_authorName_fkey" FOREIGN KEY ("authorName") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;
