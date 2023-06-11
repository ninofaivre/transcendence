/*
  Warnings:

  - The `requestedUserStatus` column on the `DirectMessage` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `requestingUserStatus` column on the `DirectMessage` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DirectMessageStatuss" AS ENUM ('ENABLED', 'DISABLED');

-- CreateEnum
CREATE TYPE "DirectMessageUserStatus" AS ENUM ('CLOSED', 'OPEN', 'MUTED');

-- AlterTable
ALTER TABLE "DirectMessage" ADD COLUMN     "status" "DirectMessageStatuss" DEFAULT 'ENABLED',
DROP COLUMN "requestedUserStatus",
ADD COLUMN     "requestedUserStatus" "DirectMessageUserStatus" NOT NULL DEFAULT 'OPEN',
DROP COLUMN "requestingUserStatus",
ADD COLUMN     "requestingUserStatus" "DirectMessageUserStatus" NOT NULL DEFAULT 'OPEN';

-- DropEnum
DROP TYPE "DirectMessageStatus";
