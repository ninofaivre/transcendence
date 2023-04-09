-- CreateEnum
CREATE TYPE "PermissionList" AS ENUM ('SEND_MESSAGE', 'DELETE_MESSAGE', 'EDIT_TITLE', 'EDIT_PASSWORD', 'EDIT_VISIBILITY', 'INVITE', 'KICK', 'BAN', 'MUTE', 'DESTROY');

-- CreateEnum
CREATE TYPE "RoleApplyingType" AS ENUM ('NONE', 'ROLES', 'ROLES_AND_SELF');

-- CreateEnum
CREATE TYPE "ChanType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "DirectMessageStatus" AS ENUM ('CLOSED', 'OPEN', 'MUTED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('AUTHOR_LEAVED', 'AUTHOR_KICKED_CONCERNED', 'AUTHOR_JOINED', 'MESSAGE_DELETED', 'PENDING_CHAN_INVITATION', 'ACCEPTED_CHAN_INVITATION', 'CANCELED_CHAN_INVITATION', 'REFUSED_CHAN_INVITATION', 'CHAN_DELETED_INVITATION');

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" "PermissionList"[],
    "roleApplyOn" "RoleApplyingType" NOT NULL,
    "chanId" INTEGER NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendInvitation" (
    "id" SERIAL NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificationDate" TIMESTAMP(3),
    "invitingUserName" TEXT NOT NULL,
    "invitedUserName" TEXT NOT NULL,

    CONSTRAINT "FriendInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChanInvitation" (
    "id" SERIAL NOT NULL,
    "chanId" INTEGER NOT NULL,
    "friendShipId" INTEGER NOT NULL,
    "discussionEventId" INTEGER NOT NULL,
    "requestingUserName" TEXT NOT NULL,
    "requestedUserName" TEXT NOT NULL,

    CONSTRAINT "ChanInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendShip" (
    "id" SERIAL NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificationDate" TIMESTAMP(3),
    "requestingUserName" TEXT NOT NULL,
    "requestedUserName" TEXT NOT NULL,

    CONSTRAINT "FriendShip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedShip" (
    "id" SERIAL NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificationDate" TIMESTAMP(3),
    "blockingUserName" TEXT NOT NULL,
    "blockedUserName" TEXT NOT NULL,

    CONSTRAINT "BlockedShip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "MutedUserChan" (
    "id" SERIAL NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "untilDate" TIMESTAMP(3),
    "mutedUserName" TEXT NOT NULL,
    "chanId" INTEGER NOT NULL,

    CONSTRAINT "MutedUserChan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chan" (
    "id" SERIAL NOT NULL,
    "type" "ChanType" NOT NULL,
    "title" TEXT,
    "password" TEXT,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificationDate" TIMESTAMP(3),
    "ownerName" TEXT NOT NULL,

    CONSTRAINT "Chan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectMessage" (
    "id" SERIAL NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificationDate" TIMESTAMP(3),
    "requestingUserName" TEXT NOT NULL,
    "requestingUserStatus" "DirectMessageStatus" NOT NULL DEFAULT 'OPEN',
    "requestingUserStatusMutedUntil" TIMESTAMP(3),
    "requestedUserName" TEXT NOT NULL,
    "requestedUserStatus" "DirectMessageStatus" NOT NULL DEFAULT 'OPEN',
    "requestedUserStatusMutedUntil" TIMESTAMP(3),
    "friendShipId" INTEGER,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionElement" (
    "id" SERIAL NOT NULL,
    "author" TEXT NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificationDate" TIMESTAMP(3),
    "directMessageId" INTEGER,
    "chanId" INTEGER,

    CONSTRAINT "DiscussionElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionEvent" (
    "id" SERIAL NOT NULL,
    "eventType" "EventType" NOT NULL,
    "concernedUser" TEXT,
    "discussionElementId" INTEGER NOT NULL,
    "deletedInvitationChanRelatedTitle" TEXT,

    CONSTRAINT "DiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionMessage" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "relatedId" INTEGER,
    "discussionElementId" INTEGER NOT NULL,

    CONSTRAINT "DiscussionMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_roles" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_RoleToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ChanToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_DiscussionMessageToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_DiscussionMessageToRole" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_chanId_name_key" ON "Role"("chanId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "FriendInvitation_invitingUserName_invitedUserName_key" ON "FriendInvitation"("invitingUserName", "invitedUserName");

-- CreateIndex
CREATE UNIQUE INDEX "ChanInvitation_discussionEventId_key" ON "ChanInvitation"("discussionEventId");

-- CreateIndex
CREATE UNIQUE INDEX "ChanInvitation_chanId_friendShipId_key" ON "ChanInvitation"("chanId", "friendShipId");

-- CreateIndex
CREATE UNIQUE INDEX "FriendShip_requestingUserName_requestedUserName_key" ON "FriendShip"("requestingUserName", "requestedUserName");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedShip_blockingUserName_blockedUserName_key" ON "BlockedShip"("blockingUserName", "blockedUserName");

-- CreateIndex
CREATE UNIQUE INDEX "MutedUserChan_chanId_mutedUserName_key" ON "MutedUserChan"("chanId", "mutedUserName");

-- CreateIndex
CREATE UNIQUE INDEX "Chan_title_key" ON "Chan"("title");

-- CreateIndex
CREATE UNIQUE INDEX "DirectMessage_friendShipId_key" ON "DirectMessage"("friendShipId");

-- CreateIndex
CREATE UNIQUE INDEX "DirectMessage_requestingUserName_requestedUserName_key" ON "DirectMessage"("requestingUserName", "requestedUserName");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionEvent_discussionElementId_key" ON "DiscussionEvent"("discussionElementId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionMessage_discussionElementId_key" ON "DiscussionMessage"("discussionElementId");

-- CreateIndex
CREATE UNIQUE INDEX "_roles_AB_unique" ON "_roles"("A", "B");

-- CreateIndex
CREATE INDEX "_roles_B_index" ON "_roles"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RoleToUser_AB_unique" ON "_RoleToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ChanToUser_AB_unique" ON "_ChanToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ChanToUser_B_index" ON "_ChanToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DiscussionMessageToUser_AB_unique" ON "_DiscussionMessageToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_DiscussionMessageToUser_B_index" ON "_DiscussionMessageToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DiscussionMessageToRole_AB_unique" ON "_DiscussionMessageToRole"("A", "B");

-- CreateIndex
CREATE INDEX "_DiscussionMessageToRole_B_index" ON "_DiscussionMessageToRole"("B");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_chanId_fkey" FOREIGN KEY ("chanId") REFERENCES "Chan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendInvitation" ADD CONSTRAINT "FriendInvitation_invitingUserName_fkey" FOREIGN KEY ("invitingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendInvitation" ADD CONSTRAINT "FriendInvitation_invitedUserName_fkey" FOREIGN KEY ("invitedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_chanId_fkey" FOREIGN KEY ("chanId") REFERENCES "Chan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_friendShipId_fkey" FOREIGN KEY ("friendShipId") REFERENCES "FriendShip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_discussionEventId_fkey" FOREIGN KEY ("discussionEventId") REFERENCES "DiscussionEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_requestingUserName_fkey" FOREIGN KEY ("requestingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_requestedUserName_fkey" FOREIGN KEY ("requestedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendShip" ADD CONSTRAINT "FriendShip_requestingUserName_fkey" FOREIGN KEY ("requestingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendShip" ADD CONSTRAINT "FriendShip_requestedUserName_fkey" FOREIGN KEY ("requestedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedShip" ADD CONSTRAINT "BlockedShip_blockingUserName_fkey" FOREIGN KEY ("blockingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedShip" ADD CONSTRAINT "BlockedShip_blockedUserName_fkey" FOREIGN KEY ("blockedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MutedUserChan" ADD CONSTRAINT "MutedUserChan_mutedUserName_fkey" FOREIGN KEY ("mutedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MutedUserChan" ADD CONSTRAINT "MutedUserChan_chanId_fkey" FOREIGN KEY ("chanId") REFERENCES "Chan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chan" ADD CONSTRAINT "Chan_ownerName_fkey" FOREIGN KEY ("ownerName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_requestingUserName_fkey" FOREIGN KEY ("requestingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_requestedUserName_fkey" FOREIGN KEY ("requestedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_friendShipId_fkey" FOREIGN KEY ("friendShipId") REFERENCES "FriendShip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionElement" ADD CONSTRAINT "DiscussionElement_author_fkey" FOREIGN KEY ("author") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionElement" ADD CONSTRAINT "DiscussionElement_directMessageId_fkey" FOREIGN KEY ("directMessageId") REFERENCES "DirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionElement" ADD CONSTRAINT "DiscussionElement_chanId_fkey" FOREIGN KEY ("chanId") REFERENCES "Chan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionEvent" ADD CONSTRAINT "DiscussionEvent_concernedUser_fkey" FOREIGN KEY ("concernedUser") REFERENCES "User"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionEvent" ADD CONSTRAINT "DiscussionEvent_discussionElementId_fkey" FOREIGN KEY ("discussionElementId") REFERENCES "DiscussionElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionEvent" ADD CONSTRAINT "DiscussionEvent_deletedInvitationChanRelatedTitle_fkey" FOREIGN KEY ("deletedInvitationChanRelatedTitle") REFERENCES "Chan"("title") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionMessage" ADD CONSTRAINT "DiscussionMessage_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "DiscussionElement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionMessage" ADD CONSTRAINT "DiscussionMessage_discussionElementId_fkey" FOREIGN KEY ("discussionElementId") REFERENCES "DiscussionElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_roles" ADD CONSTRAINT "_roles_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_roles" ADD CONSTRAINT "_roles_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChanToUser" ADD CONSTRAINT "_ChanToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Chan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChanToUser" ADD CONSTRAINT "_ChanToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DiscussionMessageToUser" ADD CONSTRAINT "_DiscussionMessageToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "DiscussionMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DiscussionMessageToUser" ADD CONSTRAINT "_DiscussionMessageToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DiscussionMessageToRole" ADD CONSTRAINT "_DiscussionMessageToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "DiscussionMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DiscussionMessageToRole" ADD CONSTRAINT "_DiscussionMessageToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
