/*
  Warnings:

  - A unique constraint covering the columns `[requestingUserName,requestedUserName]` on the table `DirectMessage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DirectMessage_requestingUserName_requestedUserName_key" ON "DirectMessage"("requestingUserName", "requestedUserName");
