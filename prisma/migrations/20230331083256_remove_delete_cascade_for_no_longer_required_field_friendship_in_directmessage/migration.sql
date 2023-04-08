-- DropForeignKey
ALTER TABLE "DirectMessage" DROP CONSTRAINT "DirectMessage_friendShipId_fkey";

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_friendShipId_fkey" FOREIGN KEY ("friendShipId") REFERENCES "FriendShip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
