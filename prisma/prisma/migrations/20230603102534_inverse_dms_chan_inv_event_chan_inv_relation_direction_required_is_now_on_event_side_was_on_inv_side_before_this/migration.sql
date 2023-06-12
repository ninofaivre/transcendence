/*
  Warnings:

  - You are about to drop the column `discussionEventId` on the `ChanInvitation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[chanInvitationId]` on the table `ChanInvitationDmDiscussionEvent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chanInvitationId` to the `ChanInvitationDmDiscussionEvent` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChanInvitation" DROP CONSTRAINT "ChanInvitation_discussionEventId_fkey";

-- DropIndex
DROP INDEX "ChanInvitation_discussionEventId_key";

-- AlterTable
ALTER TABLE "ChanInvitation" DROP COLUMN "discussionEventId";

-- AlterTable
ALTER TABLE "ChanInvitationDmDiscussionEvent" ADD COLUMN     "chanInvitationId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ChanInvitationDmDiscussionEvent_chanInvitationId_key" ON "ChanInvitationDmDiscussionEvent"("chanInvitationId");

-- AddForeignKey
ALTER TABLE "ChanInvitationDmDiscussionEvent" ADD CONSTRAINT "ChanInvitationDmDiscussionEvent_chanInvitationId_fkey" FOREIGN KEY ("chanInvitationId") REFERENCES "ChanInvitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
