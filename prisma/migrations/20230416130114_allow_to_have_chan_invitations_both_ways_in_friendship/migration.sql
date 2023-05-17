/*
  Warnings:

  - A unique constraint covering the columns `[chanId,friendShipId,requestingUserName]` on the table `ChanInvitation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ChanInvitation_chanId_friendShipId_key";

-- CreateIndex
CREATE UNIQUE INDEX "ChanInvitation_chanId_friendShipId_requestingUserName_key" ON "ChanInvitation"("chanId", "friendShipId", "requestingUserName");
