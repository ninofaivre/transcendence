/*
  Warnings:

  - You are about to drop the column `password` on the `Discussion` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Discussion` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Discussion` table. All the data in the column will be lost.
  - You are about to drop the `_DiscussionToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_DiscussionToUser" DROP CONSTRAINT "_DiscussionToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_DiscussionToUser" DROP CONSTRAINT "_DiscussionToUser_B_fkey";

-- AlterTable
ALTER TABLE "Discussion" DROP COLUMN "password",
DROP COLUMN "title",
DROP COLUMN "type";

-- DropTable
DROP TABLE "_DiscussionToUser";

-- CreateTable
CREATE TABLE "DirectMessage" (
    "id" SERIAL NOT NULL,
    "meName" TEXT NOT NULL,
    "otherGuyName" TEXT NOT NULL,
    "discussionId" INTEGER NOT NULL,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DirectMessage_meName_key" ON "DirectMessage"("meName");

-- CreateIndex
CREATE UNIQUE INDEX "DirectMessage_otherGuyName_key" ON "DirectMessage"("otherGuyName");

-- CreateIndex
CREATE UNIQUE INDEX "DirectMessage_discussionId_key" ON "DirectMessage"("discussionId");

-- CreateIndex
CREATE UNIQUE INDEX "DirectMessage_meName_otherGuyName_key" ON "DirectMessage"("meName", "otherGuyName");

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_meName_fkey" FOREIGN KEY ("meName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_otherGuyName_fkey" FOREIGN KEY ("otherGuyName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
