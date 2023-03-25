-- CreateEnum
CREATE TYPE "PermissionList" AS ENUM ('SEND_MESSAGE', 'DELETE_MESSAGE', 'EDIT_TITLE', 'EDIT_PASSWORD', 'EDIT_VISIBILITY', 'INVITE', 'KICK', 'BAN', 'MUTE', 'DESTROY');

-- CreateEnum
CREATE TYPE "RoleApplyingType" AS ENUM ('NONE', 'ROLES', 'ROLES_AND_SELF');

-- CreateEnum
CREATE TYPE "ChanType" AS ENUM ('PUBLIC', 'PRIVATE');

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
CREATE TABLE "User" (
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "Chan" (
    "id" SERIAL NOT NULL,
    "type" "ChanType" NOT NULL,
    "title" TEXT,
    "password" TEXT,
    "ownerName" TEXT NOT NULL,
    "discussionId" INTEGER NOT NULL,

    CONSTRAINT "Chan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectMessage" (
    "id" SERIAL NOT NULL,
    "discussionId" INTEGER NOT NULL,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discussion" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "Discussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionElement" (
    "id" SERIAL NOT NULL,
    "author" TEXT NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificationDate" TIMESTAMP(3),
    "discussionId" INTEGER NOT NULL,

    CONSTRAINT "DiscussionElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionEvent" (
    "id" SERIAL NOT NULL,
    "eventType" TEXT NOT NULL,
    "concernedUser" TEXT,
    "discussionElementId" INTEGER NOT NULL,

    CONSTRAINT "DiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionMessage" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
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
CREATE TABLE "_friendList" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_friendInvitation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_blockedUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ChanToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_directMessage" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_chanId_name_key" ON "Role"("chanId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Chan_title_key" ON "Chan"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Chan_discussionId_key" ON "Chan"("discussionId");

-- CreateIndex
CREATE UNIQUE INDEX "DirectMessage_discussionId_key" ON "DirectMessage"("discussionId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionElement_author_key" ON "DiscussionElement"("author");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionEvent_concernedUser_key" ON "DiscussionEvent"("concernedUser");

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
CREATE UNIQUE INDEX "_friendList_AB_unique" ON "_friendList"("A", "B");

-- CreateIndex
CREATE INDEX "_friendList_B_index" ON "_friendList"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_friendInvitation_AB_unique" ON "_friendInvitation"("A", "B");

-- CreateIndex
CREATE INDEX "_friendInvitation_B_index" ON "_friendInvitation"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_blockedUser_AB_unique" ON "_blockedUser"("A", "B");

-- CreateIndex
CREATE INDEX "_blockedUser_B_index" ON "_blockedUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ChanToUser_AB_unique" ON "_ChanToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ChanToUser_B_index" ON "_ChanToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_directMessage_AB_unique" ON "_directMessage"("A", "B");

-- CreateIndex
CREATE INDEX "_directMessage_B_index" ON "_directMessage"("B");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_chanId_fkey" FOREIGN KEY ("chanId") REFERENCES "Chan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chan" ADD CONSTRAINT "Chan_ownerName_fkey" FOREIGN KEY ("ownerName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chan" ADD CONSTRAINT "Chan_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionElement" ADD CONSTRAINT "DiscussionElement_author_fkey" FOREIGN KEY ("author") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionElement" ADD CONSTRAINT "DiscussionElement_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionEvent" ADD CONSTRAINT "DiscussionEvent_concernedUser_fkey" FOREIGN KEY ("concernedUser") REFERENCES "User"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionEvent" ADD CONSTRAINT "DiscussionEvent_discussionElementId_fkey" FOREIGN KEY ("discussionElementId") REFERENCES "DiscussionElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "_friendList" ADD CONSTRAINT "_friendList_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_friendList" ADD CONSTRAINT "_friendList_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_friendInvitation" ADD CONSTRAINT "_friendInvitation_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_friendInvitation" ADD CONSTRAINT "_friendInvitation_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_blockedUser" ADD CONSTRAINT "_blockedUser_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_blockedUser" ADD CONSTRAINT "_blockedUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChanToUser" ADD CONSTRAINT "_ChanToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Chan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChanToUser" ADD CONSTRAINT "_ChanToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_directMessage" ADD CONSTRAINT "_directMessage_A_fkey" FOREIGN KEY ("A") REFERENCES "DirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_directMessage" ADD CONSTRAINT "_directMessage_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;
