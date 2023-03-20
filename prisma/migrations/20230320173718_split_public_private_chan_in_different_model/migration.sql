/*
  Warnings:

  - You are about to drop the `Chan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_chan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Chan" DROP CONSTRAINT "Chan_discussionId_fkey";

-- DropForeignKey
ALTER TABLE "DiscussionEvent" DROP CONSTRAINT "DiscussionEvent_concernedUser_fkey";

-- DropForeignKey
ALTER TABLE "_chan" DROP CONSTRAINT "_chan_A_fkey";

-- DropForeignKey
ALTER TABLE "_chan" DROP CONSTRAINT "_chan_B_fkey";

-- AlterTable
ALTER TABLE "DiscussionEvent" ALTER COLUMN "concernedUser" DROP NOT NULL;

-- DropTable
DROP TABLE "Chan";

-- DropTable
DROP TABLE "_chan";

-- DropEnum
DROP TYPE "ChanType";

-- CreateTable
CREATE TABLE "PublicChan" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "password" TEXT,
    "discussionId" INTEGER NOT NULL,

    CONSTRAINT "PublicChan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateChan" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "discussionId" INTEGER NOT NULL,

    CONSTRAINT "PrivateChan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_publicChan" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_privateChan" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicChan_title_key" ON "PublicChan"("title");

-- CreateIndex
CREATE UNIQUE INDEX "PublicChan_discussionId_key" ON "PublicChan"("discussionId");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateChan_discussionId_key" ON "PrivateChan"("discussionId");

-- CreateIndex
CREATE UNIQUE INDEX "_publicChan_AB_unique" ON "_publicChan"("A", "B");

-- CreateIndex
CREATE INDEX "_publicChan_B_index" ON "_publicChan"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_privateChan_AB_unique" ON "_privateChan"("A", "B");

-- CreateIndex
CREATE INDEX "_privateChan_B_index" ON "_privateChan"("B");

-- AddForeignKey
ALTER TABLE "PublicChan" ADD CONSTRAINT "PublicChan_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateChan" ADD CONSTRAINT "PrivateChan_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionEvent" ADD CONSTRAINT "DiscussionEvent_concernedUser_fkey" FOREIGN KEY ("concernedUser") REFERENCES "User"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_publicChan" ADD CONSTRAINT "_publicChan_A_fkey" FOREIGN KEY ("A") REFERENCES "PublicChan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_publicChan" ADD CONSTRAINT "_publicChan_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_privateChan" ADD CONSTRAINT "_privateChan_A_fkey" FOREIGN KEY ("A") REFERENCES "PrivateChan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_privateChan" ADD CONSTRAINT "_privateChan_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;
