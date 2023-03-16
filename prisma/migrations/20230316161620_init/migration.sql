/*
  Warnings:

  - You are about to drop the `DirectMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrivChan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PubChan` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `type` to the `Discussion` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DiscussionType" AS ENUM ('PRIVATE_CHAN', 'PUBLIC_CHAN', 'DIRECT_MESSAGE');

-- DropForeignKey
ALTER TABLE "DirectMessage" DROP CONSTRAINT "DirectMessage_discussionId_fkey";

-- DropForeignKey
ALTER TABLE "PrivChan" DROP CONSTRAINT "PrivChan_discussionId_fkey";

-- DropForeignKey
ALTER TABLE "PubChan" DROP CONSTRAINT "PubChan_discussionId_fkey";

-- AlterTable
ALTER TABLE "Discussion" ADD COLUMN     "password" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "type" "DiscussionType" NOT NULL;

-- DropTable
DROP TABLE "DirectMessage";

-- DropTable
DROP TABLE "PrivChan";

-- DropTable
DROP TABLE "PubChan";
