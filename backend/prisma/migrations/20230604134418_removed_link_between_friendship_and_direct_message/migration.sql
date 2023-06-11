/*
  Warnings:

  - You are about to drop the column `friendShipId` on the `DirectMessage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "DirectMessage" DROP CONSTRAINT "DirectMessage_friendShipId_fkey";

-- DropIndex
DROP INDEX "DirectMessage_friendShipId_key";

-- AlterTable
ALTER TABLE "DirectMessage" DROP COLUMN "friendShipId";
