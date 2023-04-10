/*
  Warnings:

  - You are about to drop the column `deletedInvitationChanRelatedTitle` on the `DiscussionEvent` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id,title]` on the table `Chan` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chanTitle` to the `ChanInvitation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChanInvitation" DROP CONSTRAINT "ChanInvitation_chanId_fkey";

-- DropForeignKey
ALTER TABLE "DiscussionEvent" DROP CONSTRAINT "DiscussionEvent_deletedInvitationChanRelatedTitle_fkey";

-- AlterTable
ALTER TABLE "ChanInvitation" ADD COLUMN     "chanTitle" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DiscussionEvent" DROP COLUMN "deletedInvitationChanRelatedTitle",
ADD COLUMN     "chanInvitationRelatedTitle" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Chan_id_title_key" ON "Chan"("id", "title");

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_chanId_chanTitle_fkey" FOREIGN KEY ("chanId", "chanTitle") REFERENCES "Chan"("id", "title") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionEvent" ADD CONSTRAINT "DiscussionEvent_chanInvitationRelatedTitle_fkey" FOREIGN KEY ("chanInvitationRelatedTitle") REFERENCES "Chan"("title") ON DELETE SET NULL ON UPDATE CASCADE;
