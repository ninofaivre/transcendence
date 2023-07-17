-- CreateEnum
CREATE TYPE "PermissionList" AS ENUM ('SEND_MESSAGE', 'DELETE_MESSAGE', 'EDIT', 'INVITE', 'KICK', 'BAN', 'MUTE', 'DESTROY');

-- CreateEnum
CREATE TYPE "RoleApplyingType" AS ENUM ('NONE', 'ROLES', 'ROLES_AND_SELF');

-- CreateEnum
CREATE TYPE "FriendInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED', 'CANCELED', 'BLOCKED_USER');

-- CreateEnum
CREATE TYPE "ChanInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED', 'CANCELED', 'DELETED_CHAN', 'BLOCKED_USER', 'BANNED_FROM_CHAN');

-- CreateEnum
CREATE TYPE "StatusVisibilityLevel" AS ENUM ('NO_ONE', 'ONLY_FRIEND', 'IN_COMMON_CHAN', 'ANYONE');

-- CreateEnum
CREATE TYPE "DmPolicyLevelType" AS ENUM ('ONLY_FRIEND', 'IN_COMMON_CHAN', 'ANYONE');

-- CreateEnum
CREATE TYPE "DirectMessageStatus" AS ENUM ('ENABLED', 'DISABLED');

-- CreateEnum
CREATE TYPE "ClassicDmEventType" AS ENUM ('CREATED_FRIENDSHIP', 'DELETED_FRIENDSHIP', 'DISABLED_DM', 'ENABLED_DM');

-- CreateEnum
CREATE TYPE "ChanType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ClassicChanEventType" AS ENUM ('AUTHOR_LEAVED', 'AUTHOR_KICKED_CONCERNED', 'AUTHOR_JOINED', 'AUTHOR_MUTED_CONCERNED');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" "PermissionList"[],
    "roleApplyOn" "RoleApplyingType" NOT NULL,
    "chanId" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendInvitation" (
    "id" TEXT NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificationDate" TIMESTAMP(3),
    "invitingUserName" TEXT NOT NULL,
    "invitedUserName" TEXT NOT NULL,
    "status" "FriendInvitationStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "FriendInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChanInvitation" (
    "id" TEXT NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificationDate" TIMESTAMP(3),
    "chanId" TEXT NOT NULL,
    "chanTitle" TEXT NOT NULL,
    "invitingUserName" TEXT NOT NULL,
    "invitedUserName" TEXT NOT NULL,
    "status" "ChanInvitationStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "ChanInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendShip" (
    "id" TEXT NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificationDate" TIMESTAMP(3),
    "requestingUserName" TEXT NOT NULL,
    "requestedUserName" TEXT NOT NULL,

    CONSTRAINT "FriendShip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedShip" (
    "id" TEXT NOT NULL,
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
    "dmPolicyLevel" "DmPolicyLevelType" NOT NULL DEFAULT 'ONLY_FRIEND',
    "statusVisibilityLevel" "StatusVisibilityLevel" NOT NULL DEFAULT 'ONLY_FRIEND',

    CONSTRAINT "User_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "DirectMessage" (
    "id" TEXT NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificationDate" TIMESTAMP(3),
    "requestingUserName" TEXT NOT NULL,
    "requestedUserName" TEXT NOT NULL,
    "status" "DirectMessageStatus" NOT NULL DEFAULT 'ENABLED',

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DmDiscussionElement" (
    "id" TEXT NOT NULL,
    "messageId" TEXT,
    "eventId" TEXT,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "directMessageId" TEXT NOT NULL,

    CONSTRAINT "DmDiscussionElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DmDiscussionMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "relatedTo" TEXT,
    "modificationDate" TIMESTAMP(3),

    CONSTRAINT "DmDiscussionMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DmDiscussionEvent" (
    "id" TEXT NOT NULL,
    "classicDmDiscussionEventId" TEXT,
    "chanInvitationDmDiscussionEventId" TEXT,
    "deletedMessageDmDiscussionEventId" TEXT,

    CONSTRAINT "DmDiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeletedMessageDmDiscussionEvent" (
    "id" TEXT NOT NULL,
    "author" TEXT NOT NULL,

    CONSTRAINT "DeletedMessageDmDiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChanInvitationDmDiscussionEvent" (
    "id" TEXT NOT NULL,
    "chanInvitationId" TEXT NOT NULL,

    CONSTRAINT "ChanInvitationDmDiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassicDmDiscussionEvent" (
    "id" TEXT NOT NULL,
    "eventType" "ClassicDmEventType" NOT NULL,

    CONSTRAINT "ClassicDmDiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chan" (
    "id" TEXT NOT NULL,
    "type" "ChanType" NOT NULL,
    "title" TEXT,
    "password" TEXT,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificationDate" TIMESTAMP(3),
    "ownerName" TEXT NOT NULL,

    CONSTRAINT "Chan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MutedUserChan" (
    "id" TEXT NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "untilDate" TIMESTAMP(3),
    "mutedUserName" TEXT NOT NULL,
    "chanId" TEXT NOT NULL,

    CONSTRAINT "MutedUserChan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChanDiscussionElement" (
    "id" TEXT NOT NULL,
    "messageId" TEXT,
    "eventId" TEXT,
    "authorName" TEXT NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificationDate" TIMESTAMP(3),
    "chanId" TEXT NOT NULL,

    CONSTRAINT "ChanDiscussionElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChanDiscussionMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "relatedTo" TEXT,

    CONSTRAINT "ChanDiscussionMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChanDiscussionEvent" (
    "id" TEXT NOT NULL,
    "concernedUserName" TEXT,
    "classicChanDiscussionEventId" TEXT,
    "changedTitleChanDiscussionEventId" TEXT,
    "deletedMessageChanDiscussionEventId" TEXT,

    CONSTRAINT "ChanDiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangedTitleChanDiscussionEvent" (
    "id" TEXT NOT NULL,
    "oldTitle" TEXT NOT NULL,
    "newTitle" TEXT NOT NULL,

    CONSTRAINT "ChangedTitleChanDiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeletedMessageChanDiscussionEvent" (
    "id" TEXT NOT NULL,
    "deletingUserName" TEXT NOT NULL,

    CONSTRAINT "DeletedMessageChanDiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassicChanDiscussionEvent" (
    "id" TEXT NOT NULL,
    "eventType" "ClassicChanEventType" NOT NULL,

    CONSTRAINT "ClassicChanDiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_roles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_RoleToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ChanToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ChanDiscussionMessageToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ChanDiscussionMessageToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_chanId_name_key" ON "Role"("chanId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "FriendShip_requestingUserName_requestedUserName_key" ON "FriendShip"("requestingUserName", "requestedUserName");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedShip_blockingUserName_blockedUserName_key" ON "BlockedShip"("blockingUserName", "blockedUserName");

-- CreateIndex
CREATE UNIQUE INDEX "DirectMessage_requestingUserName_requestedUserName_key" ON "DirectMessage"("requestingUserName", "requestedUserName");

-- CreateIndex
CREATE UNIQUE INDEX "DmDiscussionElement_messageId_key" ON "DmDiscussionElement"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "DmDiscussionElement_eventId_key" ON "DmDiscussionElement"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "DmDiscussionEvent_classicDmDiscussionEventId_key" ON "DmDiscussionEvent"("classicDmDiscussionEventId");

-- CreateIndex
CREATE UNIQUE INDEX "DmDiscussionEvent_chanInvitationDmDiscussionEventId_key" ON "DmDiscussionEvent"("chanInvitationDmDiscussionEventId");

-- CreateIndex
CREATE UNIQUE INDEX "DmDiscussionEvent_deletedMessageDmDiscussionEventId_key" ON "DmDiscussionEvent"("deletedMessageDmDiscussionEventId");

-- CreateIndex
CREATE UNIQUE INDEX "ChanInvitationDmDiscussionEvent_chanInvitationId_key" ON "ChanInvitationDmDiscussionEvent"("chanInvitationId");

-- CreateIndex
CREATE UNIQUE INDEX "Chan_title_key" ON "Chan"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Chan_id_title_key" ON "Chan"("id", "title");

-- CreateIndex
CREATE UNIQUE INDEX "MutedUserChan_chanId_mutedUserName_key" ON "MutedUserChan"("chanId", "mutedUserName");

-- CreateIndex
CREATE UNIQUE INDEX "ChanDiscussionElement_messageId_key" ON "ChanDiscussionElement"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "ChanDiscussionElement_eventId_key" ON "ChanDiscussionElement"("eventId");

-- CreateIndex
CREATE INDEX "ChanDiscussionElement_creationDate_idx" ON "ChanDiscussionElement"("creationDate" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ChanDiscussionEvent_classicChanDiscussionEventId_key" ON "ChanDiscussionEvent"("classicChanDiscussionEventId");

-- CreateIndex
CREATE UNIQUE INDEX "ChanDiscussionEvent_changedTitleChanDiscussionEventId_key" ON "ChanDiscussionEvent"("changedTitleChanDiscussionEventId");

-- CreateIndex
CREATE UNIQUE INDEX "ChanDiscussionEvent_deletedMessageChanDiscussionEventId_key" ON "ChanDiscussionEvent"("deletedMessageChanDiscussionEventId");

-- CreateIndex
CREATE UNIQUE INDEX "DeletedMessageChanDiscussionEvent_deletingUserName_key" ON "DeletedMessageChanDiscussionEvent"("deletingUserName");

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
CREATE UNIQUE INDEX "_ChanDiscussionMessageToUser_AB_unique" ON "_ChanDiscussionMessageToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ChanDiscussionMessageToUser_B_index" ON "_ChanDiscussionMessageToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ChanDiscussionMessageToRole_AB_unique" ON "_ChanDiscussionMessageToRole"("A", "B");

-- CreateIndex
CREATE INDEX "_ChanDiscussionMessageToRole_B_index" ON "_ChanDiscussionMessageToRole"("B");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_chanId_fkey" FOREIGN KEY ("chanId") REFERENCES "Chan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendInvitation" ADD CONSTRAINT "FriendInvitation_invitingUserName_fkey" FOREIGN KEY ("invitingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendInvitation" ADD CONSTRAINT "FriendInvitation_invitedUserName_fkey" FOREIGN KEY ("invitedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_chanId_chanTitle_fkey" FOREIGN KEY ("chanId", "chanTitle") REFERENCES "Chan"("id", "title") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_invitingUserName_fkey" FOREIGN KEY ("invitingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_invitedUserName_fkey" FOREIGN KEY ("invitedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendShip" ADD CONSTRAINT "FriendShip_requestingUserName_fkey" FOREIGN KEY ("requestingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendShip" ADD CONSTRAINT "FriendShip_requestedUserName_fkey" FOREIGN KEY ("requestedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedShip" ADD CONSTRAINT "BlockedShip_blockingUserName_fkey" FOREIGN KEY ("blockingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedShip" ADD CONSTRAINT "BlockedShip_blockedUserName_fkey" FOREIGN KEY ("blockedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_requestingUserName_fkey" FOREIGN KEY ("requestingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_requestedUserName_fkey" FOREIGN KEY ("requestedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionElement" ADD CONSTRAINT "DmDiscussionElement_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "DmDiscussionMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionElement" ADD CONSTRAINT "DmDiscussionElement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "DmDiscussionEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionElement" ADD CONSTRAINT "DmDiscussionElement_directMessageId_fkey" FOREIGN KEY ("directMessageId") REFERENCES "DirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionMessage" ADD CONSTRAINT "DmDiscussionMessage_author_fkey" FOREIGN KEY ("author") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionMessage" ADD CONSTRAINT "DmDiscussionMessage_relatedTo_fkey" FOREIGN KEY ("relatedTo") REFERENCES "DmDiscussionElement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionEvent" ADD CONSTRAINT "DmDiscussionEvent_classicDmDiscussionEventId_fkey" FOREIGN KEY ("classicDmDiscussionEventId") REFERENCES "ClassicDmDiscussionEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionEvent" ADD CONSTRAINT "DmDiscussionEvent_chanInvitationDmDiscussionEventId_fkey" FOREIGN KEY ("chanInvitationDmDiscussionEventId") REFERENCES "ChanInvitationDmDiscussionEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionEvent" ADD CONSTRAINT "DmDiscussionEvent_deletedMessageDmDiscussionEventId_fkey" FOREIGN KEY ("deletedMessageDmDiscussionEventId") REFERENCES "DeletedMessageDmDiscussionEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletedMessageDmDiscussionEvent" ADD CONSTRAINT "DeletedMessageDmDiscussionEvent_author_fkey" FOREIGN KEY ("author") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanInvitationDmDiscussionEvent" ADD CONSTRAINT "ChanInvitationDmDiscussionEvent_chanInvitationId_fkey" FOREIGN KEY ("chanInvitationId") REFERENCES "ChanInvitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chan" ADD CONSTRAINT "Chan_ownerName_fkey" FOREIGN KEY ("ownerName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MutedUserChan" ADD CONSTRAINT "MutedUserChan_mutedUserName_fkey" FOREIGN KEY ("mutedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MutedUserChan" ADD CONSTRAINT "MutedUserChan_chanId_fkey" FOREIGN KEY ("chanId") REFERENCES "Chan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionElement" ADD CONSTRAINT "ChanDiscussionElement_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChanDiscussionMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionElement" ADD CONSTRAINT "ChanDiscussionElement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ChanDiscussionEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionElement" ADD CONSTRAINT "ChanDiscussionElement_authorName_fkey" FOREIGN KEY ("authorName") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionElement" ADD CONSTRAINT "ChanDiscussionElement_chanId_fkey" FOREIGN KEY ("chanId") REFERENCES "Chan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionMessage" ADD CONSTRAINT "ChanDiscussionMessage_relatedTo_fkey" FOREIGN KEY ("relatedTo") REFERENCES "ChanDiscussionElement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionEvent" ADD CONSTRAINT "ChanDiscussionEvent_concernedUserName_fkey" FOREIGN KEY ("concernedUserName") REFERENCES "User"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionEvent" ADD CONSTRAINT "ChanDiscussionEvent_classicChanDiscussionEventId_fkey" FOREIGN KEY ("classicChanDiscussionEventId") REFERENCES "ClassicChanDiscussionEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionEvent" ADD CONSTRAINT "ChanDiscussionEvent_changedTitleChanDiscussionEventId_fkey" FOREIGN KEY ("changedTitleChanDiscussionEventId") REFERENCES "ChangedTitleChanDiscussionEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionEvent" ADD CONSTRAINT "ChanDiscussionEvent_deletedMessageChanDiscussionEventId_fkey" FOREIGN KEY ("deletedMessageChanDiscussionEventId") REFERENCES "DeletedMessageChanDiscussionEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletedMessageChanDiscussionEvent" ADD CONSTRAINT "DeletedMessageChanDiscussionEvent_deletingUserName_fkey" FOREIGN KEY ("deletingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "_ChanDiscussionMessageToUser" ADD CONSTRAINT "_ChanDiscussionMessageToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "ChanDiscussionMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChanDiscussionMessageToUser" ADD CONSTRAINT "_ChanDiscussionMessageToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChanDiscussionMessageToRole" ADD CONSTRAINT "_ChanDiscussionMessageToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "ChanDiscussionMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChanDiscussionMessageToRole" ADD CONSTRAINT "_ChanDiscussionMessageToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
