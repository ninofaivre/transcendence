/*
  Warnings:

  - The values [AUTHOR_MUTED_CONCERNED] on the enum `ClassicChanEventType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `roleApplyOn` on the `Role` table. All the data in the column will be lost.
  - The `dmPolicyLevel` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `statusVisibilityLevel` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[mutedUserChanDiscussionEventId]` on the table `ChanDiscussionEvent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `modificationDate` to the `ChanDiscussionMessage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AccessPolicyLevel" AS ENUM ('NO_ONE', 'ONLY_FRIEND', 'IN_COMMON_CHAN', 'ANYONE');

-- AlterEnum
BEGIN;
CREATE TYPE "ClassicChanEventType_new" AS ENUM ('AUTHOR_LEAVED', 'AUTHOR_KICKED_CONCERNED', 'AUTHOR_JOINED');
ALTER TABLE "ClassicChanDiscussionEvent" ALTER COLUMN "eventType" TYPE "ClassicChanEventType_new" USING ("eventType"::text::"ClassicChanEventType_new");
ALTER TYPE "ClassicChanEventType" RENAME TO "ClassicChanEventType_old";
ALTER TYPE "ClassicChanEventType_new" RENAME TO "ClassicChanEventType";
DROP TYPE "ClassicChanEventType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "PermissionList" ADD VALUE 'UPDATE_MESSAGE';

-- DropIndex
DROP INDEX "DeletedMessageChanDiscussionEvent_deletingUserName_key";

-- DropIndex
DROP INDEX "MutedUserChan_chanId_mutedUserName_key";

-- AlterTable
ALTER TABLE "ChanDiscussionEvent" ADD COLUMN     "mutedUserChanDiscussionEventId" TEXT;

-- AlterTable
ALTER TABLE "ChanDiscussionMessage" ADD COLUMN     "modificationDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "roleApplyOn";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "dmPolicyLevel",
ADD COLUMN     "dmPolicyLevel" "AccessPolicyLevel" NOT NULL DEFAULT 'ONLY_FRIEND',
DROP COLUMN "statusVisibilityLevel",
ADD COLUMN     "statusVisibilityLevel" "AccessPolicyLevel" NOT NULL DEFAULT 'IN_COMMON_CHAN';

-- DropEnum
DROP TYPE "DmPolicyLevelType";

-- DropEnum
DROP TYPE "RoleApplyingType";

-- DropEnum
DROP TYPE "StatusVisibilityLevel";

-- CreateTable
CREATE TABLE "MutedUserChanDiscussionEvent" (
    "id" TEXT NOT NULL,
    "mutedUserName" TEXT NOT NULL,
    "timeoutInMs" INTEGER,

    CONSTRAINT "MutedUserChanDiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChanDiscussionEvent_mutedUserChanDiscussionEventId_key" ON "ChanDiscussionEvent"("mutedUserChanDiscussionEventId");

-- AddForeignKey
ALTER TABLE "ChanDiscussionEvent" ADD CONSTRAINT "ChanDiscussionEvent_mutedUserChanDiscussionEventId_fkey" FOREIGN KEY ("mutedUserChanDiscussionEventId") REFERENCES "MutedUserChanDiscussionEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MutedUserChanDiscussionEvent" ADD CONSTRAINT "MutedUserChanDiscussionEvent_mutedUserName_fkey" FOREIGN KEY ("mutedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
