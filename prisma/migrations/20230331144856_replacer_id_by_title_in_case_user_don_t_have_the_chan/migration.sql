/*
  Warnings:

  - You are about to drop the column `deletedInvitationChanRelatedId` on the `DiscussionEvent` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[deletedInvitationChanRelatedTitle]` on the table `DiscussionEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "DiscussionEvent" DROP CONSTRAINT "DiscussionEvent_deletedInvitationChanRelatedId_fkey";

-- DropIndex
DROP INDEX "DiscussionEvent_deletedInvitationChanRelatedId_key";

-- AlterTable
ALTER TABLE "DiscussionEvent" DROP COLUMN "deletedInvitationChanRelatedId",
ADD COLUMN     "deletedInvitationChanRelatedTitle" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionEvent_deletedInvitationChanRelatedTitle_key" ON "DiscussionEvent"("deletedInvitationChanRelatedTitle");

-- AddForeignKey
ALTER TABLE "DiscussionEvent" ADD CONSTRAINT "DiscussionEvent_deletedInvitationChanRelatedTitle_fkey" FOREIGN KEY ("deletedInvitationChanRelatedTitle") REFERENCES "Chan"("title") ON DELETE SET NULL ON UPDATE CASCADE;
