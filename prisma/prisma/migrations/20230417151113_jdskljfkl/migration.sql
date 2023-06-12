/*
  Warnings:

  - Made the column `chanInvitationRelatedTitle` on table `DiscussionEvent` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "DiscussionEvent" DROP CONSTRAINT "DiscussionEvent_chanInvitationRelatedTitle_fkey";

-- AlterTable
ALTER TABLE "DiscussionEvent" ALTER COLUMN "chanInvitationRelatedTitle" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "DiscussionEvent" ADD CONSTRAINT "DiscussionEvent_chanInvitationRelatedTitle_fkey" FOREIGN KEY ("chanInvitationRelatedTitle") REFERENCES "Chan"("title") ON DELETE RESTRICT ON UPDATE CASCADE;
