-- CreateEnum
CREATE TYPE "DirectMessageStatus" AS ENUM ('CLOSED', 'OPEN', 'MUTED');

-- AlterTable
ALTER TABLE "DirectMessage" ADD COLUMN     "requestedUserStatus" "DirectMessageStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "requestedUserStatusMutedUntil" TIMESTAMP(3),
ADD COLUMN     "requestingUserStatus" "DirectMessageStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "requestingUserStatusMutedUntil" TIMESTAMP(3);
