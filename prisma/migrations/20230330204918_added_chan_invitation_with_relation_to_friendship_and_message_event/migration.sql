-- AlterEnum
ALTER TYPE "EventType" ADD VALUE 'CHAN_INVITATION';

-- CreateTable
CREATE TABLE "ChanInvitation" (
    "id" SERIAL NOT NULL,
    "chanId" INTEGER NOT NULL,
    "friendShipId" INTEGER NOT NULL,
    "discussionEventId" INTEGER NOT NULL,

    CONSTRAINT "ChanInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChanInvitation_chanId_friendShipId_key" ON "ChanInvitation"("chanId", "friendShipId");

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_chanId_fkey" FOREIGN KEY ("chanId") REFERENCES "Chan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_friendShipId_fkey" FOREIGN KEY ("friendShipId") REFERENCES "FriendShip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_discussionEventId_fkey" FOREIGN KEY ("discussionEventId") REFERENCES "DiscussionEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
