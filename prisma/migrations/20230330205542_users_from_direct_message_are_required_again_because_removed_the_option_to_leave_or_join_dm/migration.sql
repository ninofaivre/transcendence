/*
  Warnings:

  - Made the column `requestedUserName` on table `DirectMessage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `requestingUserName` on table `DirectMessage` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "DirectMessage" DROP CONSTRAINT "DirectMessage_requestedUserName_fkey";

-- DropForeignKey
ALTER TABLE "DirectMessage" DROP CONSTRAINT "DirectMessage_requestingUserName_fkey";

-- AlterTable
ALTER TABLE "DirectMessage" ALTER COLUMN "requestedUserName" SET NOT NULL,
ALTER COLUMN "requestingUserName" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_requestingUserName_fkey" FOREIGN KEY ("requestingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_requestedUserName_fkey" FOREIGN KEY ("requestedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
