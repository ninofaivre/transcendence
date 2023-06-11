/*
  Warnings:

  - A unique constraint covering the columns `[discussionEventId]` on the table `ChanInvitation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[deletedInvitationChanRelatedId]` on the table `DiscussionEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "DiscussionEvent" ADD COLUMN     "deletedInvitationChanRelatedId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "ChanInvitation_discussionEventId_key" ON "ChanInvitation"("discussionEventId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionEvent_deletedInvitationChanRelatedId_key" ON "DiscussionEvent"("deletedInvitationChanRelatedId");

-- AddForeignKey
ALTER TABLE "DiscussionEvent" ADD CONSTRAINT "DiscussionEvent_deletedInvitationChanRelatedId_fkey" FOREIGN KEY ("deletedInvitationChanRelatedId") REFERENCES "Chan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
