/*
  Warnings:

  - The primary key for the `BlockedShip` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Chan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ChanDiscussionElement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ChanDiscussionEvent` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ChanDiscussionMessage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ChanInvitation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `DirectMessage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `DmDiscussionElement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `DmDiscussionEvent` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `DmDiscussionMessage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `FriendInvitation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `FriendShip` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `MutedUserChan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Role` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "ChanDiscussionElement" DROP CONSTRAINT "ChanDiscussionElement_chanId_fkey";

-- DropForeignKey
ALTER TABLE "ChanDiscussionEvent" DROP CONSTRAINT "ChanDiscussionEvent_discussionElementId_fkey";

-- DropForeignKey
ALTER TABLE "ChanDiscussionMessage" DROP CONSTRAINT "ChanDiscussionMessage_discussionElementId_fkey";

-- DropForeignKey
ALTER TABLE "ChanDiscussionMessage" DROP CONSTRAINT "ChanDiscussionMessage_relatedTo_fkey";

-- DropForeignKey
ALTER TABLE "ChanInvitation" DROP CONSTRAINT "ChanInvitation_chanId_chanTitle_fkey";

-- DropForeignKey
ALTER TABLE "ChanInvitation" DROP CONSTRAINT "ChanInvitation_discussionEventId_fkey";

-- DropForeignKey
ALTER TABLE "ChanInvitation" DROP CONSTRAINT "ChanInvitation_friendShipId_fkey";

-- DropForeignKey
ALTER TABLE "DirectMessage" DROP CONSTRAINT "DirectMessage_friendShipId_fkey";

-- DropForeignKey
ALTER TABLE "DmDiscussionElement" DROP CONSTRAINT "DmDiscussionElement_directMessageId_fkey";

-- DropForeignKey
ALTER TABLE "DmDiscussionEvent" DROP CONSTRAINT "DmDiscussionEvent_discussionElementId_fkey";

-- DropForeignKey
ALTER TABLE "DmDiscussionMessage" DROP CONSTRAINT "DmDiscussionMessage_discussionElementId_fkey";

-- DropForeignKey
ALTER TABLE "DmDiscussionMessage" DROP CONSTRAINT "DmDiscussionMessage_relatedTo_fkey";

-- DropForeignKey
ALTER TABLE "MutedUserChan" DROP CONSTRAINT "MutedUserChan_chanId_fkey";

-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_chanId_fkey";

-- DropForeignKey
ALTER TABLE "_ChanDiscussionMessageToRole" DROP CONSTRAINT "_ChanDiscussionMessageToRole_A_fkey";

-- DropForeignKey
ALTER TABLE "_ChanDiscussionMessageToRole" DROP CONSTRAINT "_ChanDiscussionMessageToRole_B_fkey";

-- DropForeignKey
ALTER TABLE "_ChanDiscussionMessageToUser" DROP CONSTRAINT "_ChanDiscussionMessageToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_ChanToUser" DROP CONSTRAINT "_ChanToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_DmDiscussionMessageToUser" DROP CONSTRAINT "_DmDiscussionMessageToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_RoleToUser" DROP CONSTRAINT "_RoleToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_roles" DROP CONSTRAINT "_roles_A_fkey";

-- DropForeignKey
ALTER TABLE "_roles" DROP CONSTRAINT "_roles_B_fkey";

-- AlterTable
ALTER TABLE "BlockedShip" DROP CONSTRAINT "BlockedShip_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "BlockedShip_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "BlockedShip_id_seq";

-- AlterTable
ALTER TABLE "Chan" DROP CONSTRAINT "Chan_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Chan_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Chan_id_seq";

-- AlterTable
ALTER TABLE "ChanDiscussionElement" DROP CONSTRAINT "ChanDiscussionElement_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "chanId" SET DATA TYPE TEXT,
ADD CONSTRAINT "ChanDiscussionElement_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ChanDiscussionElement_id_seq";

-- AlterTable
ALTER TABLE "ChanDiscussionEvent" DROP CONSTRAINT "ChanDiscussionEvent_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "discussionElementId" SET DATA TYPE TEXT,
ADD CONSTRAINT "ChanDiscussionEvent_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ChanDiscussionEvent_id_seq";

-- AlterTable
ALTER TABLE "ChanDiscussionMessage" DROP CONSTRAINT "ChanDiscussionMessage_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "relatedTo" SET DATA TYPE TEXT,
ALTER COLUMN "discussionElementId" SET DATA TYPE TEXT,
ADD CONSTRAINT "ChanDiscussionMessage_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ChanDiscussionMessage_id_seq";

-- AlterTable
ALTER TABLE "ChanInvitation" DROP CONSTRAINT "ChanInvitation_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "chanId" SET DATA TYPE TEXT,
ALTER COLUMN "friendShipId" SET DATA TYPE TEXT,
ALTER COLUMN "discussionEventId" SET DATA TYPE TEXT,
ADD CONSTRAINT "ChanInvitation_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ChanInvitation_id_seq";

-- AlterTable
ALTER TABLE "DirectMessage" DROP CONSTRAINT "DirectMessage_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "friendShipId" SET DATA TYPE TEXT,
ADD CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "DirectMessage_id_seq";

-- AlterTable
ALTER TABLE "DmDiscussionElement" DROP CONSTRAINT "DmDiscussionElement_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "directMessageId" SET DATA TYPE TEXT,
ADD CONSTRAINT "DmDiscussionElement_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "DmDiscussionElement_id_seq";

-- AlterTable
ALTER TABLE "DmDiscussionEvent" DROP CONSTRAINT "DmDiscussionEvent_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "discussionElementId" SET DATA TYPE TEXT,
ADD CONSTRAINT "DmDiscussionEvent_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "DmDiscussionEvent_id_seq";

-- AlterTable
ALTER TABLE "DmDiscussionMessage" DROP CONSTRAINT "DmDiscussionMessage_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "relatedTo" SET DATA TYPE TEXT,
ALTER COLUMN "discussionElementId" SET DATA TYPE TEXT,
ADD CONSTRAINT "DmDiscussionMessage_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "DmDiscussionMessage_id_seq";

-- AlterTable
ALTER TABLE "FriendInvitation" DROP CONSTRAINT "FriendInvitation_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "FriendInvitation_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "FriendInvitation_id_seq";

-- AlterTable
ALTER TABLE "FriendShip" DROP CONSTRAINT "FriendShip_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "FriendShip_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "FriendShip_id_seq";

-- AlterTable
ALTER TABLE "MutedUserChan" DROP CONSTRAINT "MutedUserChan_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "chanId" SET DATA TYPE TEXT,
ADD CONSTRAINT "MutedUserChan_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "MutedUserChan_id_seq";

-- AlterTable
ALTER TABLE "Role" DROP CONSTRAINT "Role_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "chanId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Role_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Role_id_seq";

-- AlterTable
ALTER TABLE "_ChanDiscussionMessageToRole" ALTER COLUMN "A" SET DATA TYPE TEXT,
ALTER COLUMN "B" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_ChanDiscussionMessageToUser" ALTER COLUMN "A" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_ChanToUser" ALTER COLUMN "A" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_DmDiscussionMessageToUser" ALTER COLUMN "A" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_RoleToUser" ALTER COLUMN "A" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_roles" ALTER COLUMN "A" SET DATA TYPE TEXT,
ALTER COLUMN "B" SET DATA TYPE TEXT;

-- CreateIndex
CREATE INDEX "ChanDiscussionElement_creationDate_idx" ON "ChanDiscussionElement"("creationDate" ASC);

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_chanId_fkey" FOREIGN KEY ("chanId") REFERENCES "Chan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_chanId_chanTitle_fkey" FOREIGN KEY ("chanId", "chanTitle") REFERENCES "Chan"("id", "title") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_friendShipId_fkey" FOREIGN KEY ("friendShipId") REFERENCES "FriendShip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_discussionEventId_fkey" FOREIGN KEY ("discussionEventId") REFERENCES "DmDiscussionEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_friendShipId_fkey" FOREIGN KEY ("friendShipId") REFERENCES "FriendShip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionElement" ADD CONSTRAINT "DmDiscussionElement_directMessageId_fkey" FOREIGN KEY ("directMessageId") REFERENCES "DirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionMessage" ADD CONSTRAINT "DmDiscussionMessage_relatedTo_fkey" FOREIGN KEY ("relatedTo") REFERENCES "DmDiscussionElement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionMessage" ADD CONSTRAINT "DmDiscussionMessage_discussionElementId_fkey" FOREIGN KEY ("discussionElementId") REFERENCES "DmDiscussionElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionEvent" ADD CONSTRAINT "DmDiscussionEvent_discussionElementId_fkey" FOREIGN KEY ("discussionElementId") REFERENCES "DmDiscussionElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MutedUserChan" ADD CONSTRAINT "MutedUserChan_chanId_fkey" FOREIGN KEY ("chanId") REFERENCES "Chan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionElement" ADD CONSTRAINT "ChanDiscussionElement_chanId_fkey" FOREIGN KEY ("chanId") REFERENCES "Chan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionMessage" ADD CONSTRAINT "ChanDiscussionMessage_relatedTo_fkey" FOREIGN KEY ("relatedTo") REFERENCES "ChanDiscussionElement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionMessage" ADD CONSTRAINT "ChanDiscussionMessage_discussionElementId_fkey" FOREIGN KEY ("discussionElementId") REFERENCES "ChanDiscussionElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionEvent" ADD CONSTRAINT "ChanDiscussionEvent_discussionElementId_fkey" FOREIGN KEY ("discussionElementId") REFERENCES "ChanDiscussionElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_roles" ADD CONSTRAINT "_roles_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_roles" ADD CONSTRAINT "_roles_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DmDiscussionMessageToUser" ADD CONSTRAINT "_DmDiscussionMessageToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "DmDiscussionMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChanToUser" ADD CONSTRAINT "_ChanToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Chan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChanDiscussionMessageToUser" ADD CONSTRAINT "_ChanDiscussionMessageToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "ChanDiscussionMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChanDiscussionMessageToRole" ADD CONSTRAINT "_ChanDiscussionMessageToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "ChanDiscussionMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChanDiscussionMessageToRole" ADD CONSTRAINT "_ChanDiscussionMessageToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
