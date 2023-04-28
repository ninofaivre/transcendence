/*
  Warnings:

  - You are about to drop the column `relatedId` on the `DiscussionMessage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "DiscussionMessage" DROP CONSTRAINT "DiscussionMessage_relatedId_fkey";

-- AlterTable
ALTER TABLE "DiscussionMessage" DROP COLUMN "relatedId",
ADD COLUMN     "relatedTo" INTEGER;

-- AddForeignKey
ALTER TABLE "DiscussionMessage" ADD CONSTRAINT "DiscussionMessage_relatedTo_fkey" FOREIGN KEY ("relatedTo") REFERENCES "DiscussionElement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
