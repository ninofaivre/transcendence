/*
  Warnings:

  - You are about to drop the column `requestedUserName` on the `ChanInvitation` table. All the data in the column will be lost.
  - You are about to drop the column `requestingUserName` on the `ChanInvitation` table. All the data in the column will be lost.
  - Added the required column `invitedUserName` to the `ChanInvitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invitingUserName` to the `ChanInvitation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChanInvitation" DROP CONSTRAINT "ChanInvitation_requestedUserName_fkey";

-- DropForeignKey
ALTER TABLE "ChanInvitation" DROP CONSTRAINT "ChanInvitation_requestingUserName_fkey";

-- AlterTable
ALTER TABLE "ChanInvitation" DROP COLUMN "requestedUserName",
DROP COLUMN "requestingUserName",
ADD COLUMN     "invitedUserName" TEXT NOT NULL,
ADD COLUMN     "invitingUserName" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_invitingUserName_fkey" FOREIGN KEY ("invitingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_invitedUserName_fkey" FOREIGN KEY ("invitedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
