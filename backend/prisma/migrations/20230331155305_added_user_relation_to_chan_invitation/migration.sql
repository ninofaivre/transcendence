/*
  Warnings:

  - Added the required column `requestedUserName` to the `ChanInvitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestingUserName` to the `ChanInvitation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChanInvitation" ADD COLUMN     "requestedUserName" TEXT NOT NULL,
ADD COLUMN     "requestingUserName" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_requestingUserName_fkey" FOREIGN KEY ("requestingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_requestedUserName_fkey" FOREIGN KEY ("requestedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
