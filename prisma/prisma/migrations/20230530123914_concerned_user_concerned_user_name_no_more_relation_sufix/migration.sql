/*
  Warnings:

  - You are about to drop the column `concernedUser` on the `ChanDiscussionEvent` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChanDiscussionEvent" DROP CONSTRAINT "ChanDiscussionEvent_concernedUser_fkey";

-- AlterTable
ALTER TABLE "ChanDiscussionEvent" DROP COLUMN "concernedUser",
ADD COLUMN     "concernedUserName" TEXT;

-- AddForeignKey
ALTER TABLE "ChanDiscussionEvent" ADD CONSTRAINT "ChanDiscussionEvent_concernedUserName_fkey" FOREIGN KEY ("concernedUserName") REFERENCES "User"("name") ON DELETE SET NULL ON UPDATE CASCADE;
