/*
  Warnings:

  - You are about to drop the column `friendShipId` on the `ChanInvitation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChanInvitation" DROP CONSTRAINT "ChanInvitation_friendShipId_fkey";

-- AlterTable
ALTER TABLE "ChanInvitation" DROP COLUMN "friendShipId";
