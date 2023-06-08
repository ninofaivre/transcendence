/*
  Warnings:

  - A unique constraint covering the columns `[deletedMessageChanDiscussionEventId]` on the table `ChanDiscussionEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ChanDiscussionEvent" ADD COLUMN     "deletedMessageChanDiscussionEventId" TEXT;

-- CreateTable
CREATE TABLE "DeletedMessageChanDiscussionEvent" (
    "id" TEXT NOT NULL,
    "deletingUserName" TEXT NOT NULL,

    CONSTRAINT "DeletedMessageChanDiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeletedMessageChanDiscussionEvent_deletingUserName_key" ON "DeletedMessageChanDiscussionEvent"("deletingUserName");

-- CreateIndex
CREATE UNIQUE INDEX "ChanDiscussionEvent_deletedMessageChanDiscussionEventId_key" ON "ChanDiscussionEvent"("deletedMessageChanDiscussionEventId");

-- AddForeignKey
ALTER TABLE "ChanDiscussionEvent" ADD CONSTRAINT "ChanDiscussionEvent_deletedMessageChanDiscussionEventId_fkey" FOREIGN KEY ("deletedMessageChanDiscussionEventId") REFERENCES "DeletedMessageChanDiscussionEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletedMessageChanDiscussionEvent" ADD CONSTRAINT "DeletedMessageChanDiscussionEvent_deletingUserName_fkey" FOREIGN KEY ("deletingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
