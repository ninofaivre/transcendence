/*
  Warnings:

  - A unique constraint covering the columns `[invitingUserName,invitedUserName]` on the table `FriendInvitation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FriendInvitation_invitingUserName_invitedUserName_key" ON "FriendInvitation"("invitingUserName", "invitedUserName");
