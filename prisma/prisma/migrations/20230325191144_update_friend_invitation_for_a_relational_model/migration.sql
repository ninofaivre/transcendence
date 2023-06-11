/*
  Warnings:

  - You are about to drop the `_friendInvitation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_friendInvitation" DROP CONSTRAINT "_friendInvitation_A_fkey";

-- DropForeignKey
ALTER TABLE "_friendInvitation" DROP CONSTRAINT "_friendInvitation_B_fkey";

-- DropTable
DROP TABLE "_friendInvitation";

-- CreateTable
CREATE TABLE "FriendInvitation" (
    "id" SERIAL NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificationDate" TIMESTAMP(3),
    "invitingUserName" TEXT NOT NULL,
    "invitedUserName" TEXT NOT NULL,

    CONSTRAINT "FriendInvitation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FriendInvitation" ADD CONSTRAINT "FriendInvitation_invitingUserName_fkey" FOREIGN KEY ("invitingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendInvitation" ADD CONSTRAINT "FriendInvitation_invitedUserName_fkey" FOREIGN KEY ("invitedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
