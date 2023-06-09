/*
  Warnings:

  - The values [DELETED_USER] on the enum `FriendInvitationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "ChanInvitationStatus" ADD VALUE 'BLOCKED_USER';

-- AlterEnum
BEGIN;
CREATE TYPE "FriendInvitationStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED', 'CANCELED', 'BLOCKED_USER');
ALTER TABLE "FriendInvitation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "FriendInvitation" ALTER COLUMN "status" TYPE "FriendInvitationStatus_new" USING ("status"::text::"FriendInvitationStatus_new");
ALTER TYPE "FriendInvitationStatus" RENAME TO "FriendInvitationStatus_old";
ALTER TYPE "FriendInvitationStatus_new" RENAME TO "FriendInvitationStatus";
DROP TYPE "FriendInvitationStatus_old";
ALTER TABLE "FriendInvitation" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "ChanInvitation" DROP CONSTRAINT "ChanInvitation_friendShipId_fkey";

-- AlterTable
ALTER TABLE "ChanInvitation" ALTER COLUMN "friendShipId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_friendShipId_fkey" FOREIGN KEY ("friendShipId") REFERENCES "FriendShip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
