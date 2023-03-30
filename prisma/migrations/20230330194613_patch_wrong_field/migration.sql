/*
  Warnings:

  - You are about to drop the column `userName` on the `MutedUserChan` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "MutedUserChan" DROP CONSTRAINT "MutedUserChan_userName_fkey";

-- AlterTable
ALTER TABLE "MutedUserChan" DROP COLUMN "userName";

-- AddForeignKey
ALTER TABLE "MutedUserChan" ADD CONSTRAINT "MutedUserChan_mutedUserName_fkey" FOREIGN KEY ("mutedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
