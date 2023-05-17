-- DropForeignKey
ALTER TABLE "ChanInvitation" DROP CONSTRAINT "ChanInvitation_discussionEventId_fkey";

-- AlterTable
ALTER TABLE "ChanInvitation" ALTER COLUMN "discussionEventId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_discussionEventId_fkey" FOREIGN KEY ("discussionEventId") REFERENCES "DiscussionEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
