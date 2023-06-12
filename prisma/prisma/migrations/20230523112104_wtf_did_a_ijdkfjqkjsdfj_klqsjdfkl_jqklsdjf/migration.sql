/*
  Warnings:

  - The values [PENDING_CHAN_INVITATION,CANCELED_CHAN_INVITATION,REFUSED_CHAN_INVITATION,CHAN_DELETED_INVITATION,ACCEPTED_CHAN_INVITATION] on the enum `EventType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[ChanInvitationId]` on the table `DiscussionEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventType_new" AS ENUM ('AUTHOR_LEAVED', 'AUTHOR_KICKED_CONCERNED', 'AUTHOR_JOINED', 'MESSAGE_DELETED', 'CHAN_INVITATION');
ALTER TABLE "DiscussionEvent" ALTER COLUMN "eventType" TYPE "EventType_new" USING ("eventType"::text::"EventType_new");
ALTER TYPE "EventType" RENAME TO "EventType_old";
ALTER TYPE "EventType_new" RENAME TO "EventType";
DROP TYPE "EventType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "ChanInvitation" DROP CONSTRAINT "ChanInvitation_discussionEventId_fkey";

-- AlterTable
ALTER TABLE "ChanInvitation" ALTER COLUMN "discussionEventId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DiscussionEvent" ADD COLUMN     "ChanInvitationId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionEvent_ChanInvitationId_key" ON "DiscussionEvent"("ChanInvitationId");

-- AddForeignKey
ALTER TABLE "DiscussionEvent" ADD CONSTRAINT "DiscussionEvent_ChanInvitationId_fkey" FOREIGN KEY ("ChanInvitationId") REFERENCES "ChanInvitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
