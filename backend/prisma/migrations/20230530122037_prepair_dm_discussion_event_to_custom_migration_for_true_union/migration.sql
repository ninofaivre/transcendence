/*
  Warnings:

  - You are about to drop the column `eventType` on the `DmDiscussionEvent` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[classicDmDiscussionEventId]` on the table `DmDiscussionEvent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[chanInvitationDmDiscussionEventId]` on the table `DmDiscussionEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ClassicDmEventType" AS ENUM ('CREATED_FRIENDSHIP', 'DELETED_FRIENDSHIP', 'DELETED_MESSAGE');

-- DropForeignKey
ALTER TABLE "ChanInvitation" DROP CONSTRAINT "ChanInvitation_discussionEventId_fkey";

-- AlterTable
ALTER TABLE "DmDiscussionEvent" DROP COLUMN "eventType",
ADD COLUMN     "chanInvitationDmDiscussionEventId" TEXT,
ADD COLUMN     "classicDmDiscussionEventId" TEXT;

-- DropEnum
DROP TYPE "DmEventType";

-- CreateTable
CREATE TABLE "ChanInvitationDmDiscussionEvent" (
    "id" TEXT NOT NULL,

    CONSTRAINT "ChanInvitationDmDiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassicDmDiscussionEvent" (
    "id" TEXT NOT NULL,
    "eventType" "ClassicDmEventType" NOT NULL,

    CONSTRAINT "ClassicDmDiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DmDiscussionEvent_classicDmDiscussionEventId_key" ON "DmDiscussionEvent"("classicDmDiscussionEventId");

-- CreateIndex
CREATE UNIQUE INDEX "DmDiscussionEvent_chanInvitationDmDiscussionEventId_key" ON "DmDiscussionEvent"("chanInvitationDmDiscussionEventId");

-- AddForeignKey
ALTER TABLE "ChanInvitation" ADD CONSTRAINT "ChanInvitation_discussionEventId_fkey" FOREIGN KEY ("discussionEventId") REFERENCES "ChanInvitationDmDiscussionEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionEvent" ADD CONSTRAINT "DmDiscussionEvent_classicDmDiscussionEventId_fkey" FOREIGN KEY ("classicDmDiscussionEventId") REFERENCES "ClassicDmDiscussionEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmDiscussionEvent" ADD CONSTRAINT "DmDiscussionEvent_chanInvitationDmDiscussionEventId_fkey" FOREIGN KEY ("chanInvitationDmDiscussionEventId") REFERENCES "ChanInvitationDmDiscussionEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
