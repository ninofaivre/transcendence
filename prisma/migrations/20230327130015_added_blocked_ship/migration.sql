/*
  Warnings:

  - You are about to drop the `_blockedUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_directMessage` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[friendShipId]` on the table `DirectMessage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[requestingUserName,requestedUserName]` on the table `DirectMessage` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `friendShipId` to the `DirectMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestedUserName` to the `DirectMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestingUserName` to the `DirectMessage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DiscussionElement" DROP CONSTRAINT "DiscussionElement_author_fkey";

-- DropForeignKey
ALTER TABLE "_blockedUser" DROP CONSTRAINT "_blockedUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_blockedUser" DROP CONSTRAINT "_blockedUser_B_fkey";

-- DropForeignKey
ALTER TABLE "_directMessage" DROP CONSTRAINT "_directMessage_A_fkey";

-- DropForeignKey
ALTER TABLE "_directMessage" DROP CONSTRAINT "_directMessage_B_fkey";

-- AlterTable
ALTER TABLE "DirectMessage" ADD COLUMN     "friendShipId" INTEGER NOT NULL,
ADD COLUMN     "requestedUserName" TEXT NOT NULL,
ADD COLUMN     "requestingUserName" TEXT NOT NULL;

-- DropTable
DROP TABLE "_blockedUser";

-- DropTable
DROP TABLE "_directMessage";

-- CreateTable
CREATE TABLE "BlockedShip" (
    "id" SERIAL NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificationDate" TIMESTAMP(3),
    "blockingUserName" TEXT NOT NULL,
    "blockedUserName" TEXT NOT NULL,

    CONSTRAINT "BlockedShip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockedShip_blockingUserName_blockedUserName_key" ON "BlockedShip"("blockingUserName", "blockedUserName");

-- CreateIndex
CREATE UNIQUE INDEX "DirectMessage_friendShipId_key" ON "DirectMessage"("friendShipId");

-- CreateIndex
CREATE UNIQUE INDEX "DirectMessage_requestingUserName_requestedUserName_key" ON "DirectMessage"("requestingUserName", "requestedUserName");

-- AddForeignKey
ALTER TABLE "BlockedShip" ADD CONSTRAINT "BlockedShip_blockingUserName_fkey" FOREIGN KEY ("blockingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedShip" ADD CONSTRAINT "BlockedShip_blockedUserName_fkey" FOREIGN KEY ("blockedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_requestingUserName_fkey" FOREIGN KEY ("requestingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_requestedUserName_fkey" FOREIGN KEY ("requestedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_friendShipId_fkey" FOREIGN KEY ("friendShipId") REFERENCES "FriendShip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionElement" ADD CONSTRAINT "DiscussionElement_author_fkey" FOREIGN KEY ("author") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;
