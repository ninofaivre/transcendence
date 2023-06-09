-- CreateEnum
CREATE TYPE "FriendInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED', 'CANCELED', 'DELETED_USER');

-- CreateEnum
CREATE TYPE "ChanInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED', 'CANCELED', 'DELETED_CHAN');

-- DropIndex
DROP INDEX "ChanInvitation_chanId_friendShipId_requestingUserName_key";

-- DropIndex
DROP INDEX "FriendInvitation_invitingUserName_invitedUserName_key";

-- AlterTable
ALTER TABLE "ChanInvitation" ADD COLUMN     "status" "ChanInvitationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "FriendInvitation" ADD COLUMN     "status" "FriendInvitationStatus" NOT NULL DEFAULT 'PENDING';
