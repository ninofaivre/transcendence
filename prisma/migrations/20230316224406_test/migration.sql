/*
  Warnings:

  - You are about to drop the column `meName` on the `DirectMessage` table. All the data in the column will be lost.
  - You are about to drop the column `otherGuyName` on the `DirectMessage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "DirectMessage" DROP CONSTRAINT "DirectMessage_meName_fkey";

-- DropForeignKey
ALTER TABLE "DirectMessage" DROP CONSTRAINT "DirectMessage_otherGuyName_fkey";

-- DropIndex
DROP INDEX "DirectMessage_meName_key";

-- DropIndex
DROP INDEX "DirectMessage_meName_otherGuyName_key";

-- DropIndex
DROP INDEX "DirectMessage_otherGuyName_key";

-- AlterTable
ALTER TABLE "DirectMessage" DROP COLUMN "meName",
DROP COLUMN "otherGuyName";

-- CreateTable
CREATE TABLE "_directMessage" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_directMessage_AB_unique" ON "_directMessage"("A", "B");

-- CreateIndex
CREATE INDEX "_directMessage_B_index" ON "_directMessage"("B");

-- AddForeignKey
ALTER TABLE "_directMessage" ADD CONSTRAINT "_directMessage_A_fkey" FOREIGN KEY ("A") REFERENCES "DirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_directMessage" ADD CONSTRAINT "_directMessage_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;
