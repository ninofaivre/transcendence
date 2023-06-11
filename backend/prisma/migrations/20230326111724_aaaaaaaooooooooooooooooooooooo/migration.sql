/*
  Warnings:

  - You are about to drop the column `discussionId` on the `Chan` table. All the data in the column will be lost.
  - You are about to drop the column `discussionId` on the `DirectMessage` table. All the data in the column will be lost.
  - You are about to drop the column `discussionId` on the `DiscussionElement` table. All the data in the column will be lost.
  - You are about to drop the `Discussion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_friendList` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[directMessageId]` on the table `DiscussionElement` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[chanId]` on the table `DiscussionElement` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Chan" DROP CONSTRAINT "Chan_discussionId_fkey";

-- DropForeignKey
ALTER TABLE "DirectMessage" DROP CONSTRAINT "DirectMessage_discussionId_fkey";

-- DropForeignKey
ALTER TABLE "DiscussionElement" DROP CONSTRAINT "DiscussionElement_discussionId_fkey";

-- DropForeignKey
ALTER TABLE "_friendList" DROP CONSTRAINT "_friendList_A_fkey";

-- DropForeignKey
ALTER TABLE "_friendList" DROP CONSTRAINT "_friendList_B_fkey";

-- DropIndex
DROP INDEX "Chan_discussionId_key";

-- DropIndex
DROP INDEX "DirectMessage_discussionId_key";

-- AlterTable
ALTER TABLE "Chan" DROP COLUMN "discussionId",
ADD COLUMN     "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "modificationDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DirectMessage" DROP COLUMN "discussionId",
ADD COLUMN     "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "modificationDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DiscussionElement" DROP COLUMN "discussionId",
ADD COLUMN     "chanId" INTEGER,
ADD COLUMN     "directMessageId" INTEGER;

-- DropTable
DROP TABLE "Discussion";

-- DropTable
DROP TABLE "_friendList";

-- CreateTable
CREATE TABLE "FriendShip" (
    "id" SERIAL NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificationDate" TIMESTAMP(3),
    "requestingUserName" TEXT NOT NULL,
    "requestedUserName" TEXT NOT NULL,

    CONSTRAINT "FriendShip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FriendShip_requestingUserName_requestedUserName_key" ON "FriendShip"("requestingUserName", "requestedUserName");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionElement_directMessageId_key" ON "DiscussionElement"("directMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionElement_chanId_key" ON "DiscussionElement"("chanId");

-- AddForeignKey
ALTER TABLE "FriendShip" ADD CONSTRAINT "FriendShip_requestingUserName_fkey" FOREIGN KEY ("requestingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendShip" ADD CONSTRAINT "FriendShip_requestedUserName_fkey" FOREIGN KEY ("requestedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionElement" ADD CONSTRAINT "DiscussionElement_directMessageId_fkey" FOREIGN KEY ("directMessageId") REFERENCES "DirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionElement" ADD CONSTRAINT "DiscussionElement_chanId_fkey" FOREIGN KEY ("chanId") REFERENCES "Chan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
