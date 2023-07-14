/*
  Warnings:

  - The values [DISABLED_DM,ENABLED_DM] on the enum `ClassicDmEventType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[blockedDmDiscussionEventId]` on the table `DmDiscussionEvent` will be added. If there are existing duplicate values, this will fail.
  - Made the column `modificationDate` on table `DmDiscussionMessage` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ClassicDmEventType_new" AS ENUM ('CREATED_FRIENDSHIP', 'DELETED_FRIENDSHIP');
ALTER TABLE "ClassicDmDiscussionEvent" ALTER COLUMN "eventType" TYPE "ClassicDmEventType_new" USING ("eventType"::text::"ClassicDmEventType_new");
ALTER TYPE "ClassicDmEventType" RENAME TO "ClassicDmEventType_old";
ALTER TYPE "ClassicDmEventType_new" RENAME TO "ClassicDmEventType";
DROP TYPE "ClassicDmEventType_old";
COMMIT;

-- AlterTable
ALTER TABLE "DmDiscussionEvent" ADD COLUMN     "blockedDmDiscussionEventId" TEXT;

-- AlterTable
ALTER TABLE "DmDiscussionMessage" ALTER COLUMN "modificationDate" SET NOT NULL;

-- CreateTable
CREATE TABLE "BlockedDmDiscussionEvent" (
    "id" TEXT NOT NULL,
    "blockingUserName" TEXT NOT NULL,
    "blockedUserName" TEXT NOT NULL,

    CONSTRAINT "BlockedDmDiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DmDiscussionEvent_blockedDmDiscussionEventId_key" ON "DmDiscussionEvent"("blockedDmDiscussionEventId");

-- AddForeignKey
ALTER TABLE "DmDiscussionEvent" ADD CONSTRAINT "DmDiscussionEvent_blockedDmDiscussionEventId_fkey" FOREIGN KEY ("blockedDmDiscussionEventId") REFERENCES "BlockedDmDiscussionEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedDmDiscussionEvent" ADD CONSTRAINT "BlockedDmDiscussionEvent_blockingUserName_fkey" FOREIGN KEY ("blockingUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedDmDiscussionEvent" ADD CONSTRAINT "BlockedDmDiscussionEvent_blockedUserName_fkey" FOREIGN KEY ("blockedUserName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
