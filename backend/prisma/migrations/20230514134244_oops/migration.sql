-- DropForeignKey
ALTER TABLE "DiscussionEvent" DROP CONSTRAINT "DiscussionEvent_chanInvitationRelatedTitle_fkey";

-- AlterTable
ALTER TABLE "DiscussionEvent" ALTER COLUMN "chanInvitationRelatedTitle" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "DiscussionEvent" ADD CONSTRAINT "DiscussionEvent_chanInvitationRelatedTitle_fkey" FOREIGN KEY ("chanInvitationRelatedTitle") REFERENCES "Chan"("title") ON DELETE SET NULL ON UPDATE CASCADE;
