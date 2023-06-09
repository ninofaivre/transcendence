/*
  Warnings:

  - You are about to drop the column `eventType` on the `ChanDiscussionEvent` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[classicChanDiscussionEventId]` on the table `ChanDiscussionEvent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[changedTitleChanDiscussionEventId]` on the table `ChanDiscussionEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ClassicChanEventType" AS ENUM ('AUTHOR_LEAVED', 'AUTHOR_KICKED_CONCERNED', 'AUTHOR_JOINED', 'AUTHOR_MUTED_CONCERNED', 'DELETED_MESSAGE');

-- AlterTable
ALTER TABLE "ChanDiscussionEvent" DROP COLUMN "eventType",
ADD COLUMN     "changedTitleChanDiscussionEventId" TEXT,
ADD COLUMN     "classicChanDiscussionEventId" TEXT;

-- DropEnum
DROP TYPE "ChanEventType";

-- CreateTable
CREATE TABLE "ChangedTitleChanDiscussionEvent" (
    "id" TEXT NOT NULL,
    "oldTitle" TEXT NOT NULL,
    "newTitle" TEXT NOT NULL,

    CONSTRAINT "ChangedTitleChanDiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassicChanDiscussionEvent" (
    "id" TEXT NOT NULL,
    "eventType" "ClassicChanEventType" NOT NULL,

    CONSTRAINT "ClassicChanDiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChanDiscussionEvent_classicChanDiscussionEventId_key" ON "ChanDiscussionEvent"("classicChanDiscussionEventId");

-- CreateIndex
CREATE UNIQUE INDEX "ChanDiscussionEvent_changedTitleChanDiscussionEventId_key" ON "ChanDiscussionEvent"("changedTitleChanDiscussionEventId");

-- AddForeignKey
ALTER TABLE "ChanDiscussionEvent" ADD CONSTRAINT "ChanDiscussionEvent_classicChanDiscussionEventId_fkey" FOREIGN KEY ("classicChanDiscussionEventId") REFERENCES "ClassicChanDiscussionEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChanDiscussionEvent" ADD CONSTRAINT "ChanDiscussionEvent_changedTitleChanDiscussionEventId_fkey" FOREIGN KEY ("changedTitleChanDiscussionEventId") REFERENCES "ChangedTitleChanDiscussionEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
