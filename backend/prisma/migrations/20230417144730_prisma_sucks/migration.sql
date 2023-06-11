/*
  Warnings:

  - Made the column `discussionEventId` on table `ChanInvitation` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ChanInvitation" DROP CONSTRAINT "ChanInvitation_discussionEventId_fkey";

-- AlterTable
ALTER TABLE "ChanInvitation" ALTER COLUMN "discussionEventId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_discussionEventId_fkey" FOREIGN KEY ("discussionEventId") REFERENCES "DiscussionEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
