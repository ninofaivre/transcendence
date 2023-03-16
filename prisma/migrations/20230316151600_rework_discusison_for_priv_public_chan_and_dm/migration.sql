/*
  Warnings:

  - You are about to drop the column `title` on the `Discussion` table. All the data in the column will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_discussionId_fkey";

-- AlterTable
ALTER TABLE "Discussion" DROP COLUMN "title";

-- DropTable
DROP TABLE "Message";

-- CreateTable
CREATE TABLE "PubChan" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "password" TEXT,
    "discussionId" INTEGER NOT NULL,

    CONSTRAINT "PubChan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivChan" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "discussionId" INTEGER NOT NULL,

    CONSTRAINT "PrivChan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectMessage" (
    "id" SERIAL NOT NULL,
    "discussionId" INTEGER NOT NULL,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionElement" (
    "id" SERIAL NOT NULL,
    "author" TEXT NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificationDate" TIMESTAMP(3),
    "discussionId" INTEGER NOT NULL,

    CONSTRAINT "DiscussionElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionEvent" (
    "id" SERIAL NOT NULL,
    "eventType" TEXT NOT NULL,
    "concernedUser" TEXT NOT NULL,
    "discussionElementId" INTEGER NOT NULL,

    CONSTRAINT "DiscussionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionMessage" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "discussionElementId" INTEGER NOT NULL,

    CONSTRAINT "DiscussionMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PubChan_discussionId_key" ON "PubChan"("discussionId");

-- CreateIndex
CREATE UNIQUE INDEX "PrivChan_discussionId_key" ON "PrivChan"("discussionId");

-- CreateIndex
CREATE UNIQUE INDEX "DirectMessage_discussionId_key" ON "DirectMessage"("discussionId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionElement_author_key" ON "DiscussionElement"("author");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionEvent_concernedUser_key" ON "DiscussionEvent"("concernedUser");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionEvent_discussionElementId_key" ON "DiscussionEvent"("discussionElementId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionMessage_discussionElementId_key" ON "DiscussionMessage"("discussionElementId");

-- AddForeignKey
ALTER TABLE "PubChan" ADD CONSTRAINT "PubChan_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivChan" ADD CONSTRAINT "PrivChan_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionElement" ADD CONSTRAINT "DiscussionElement_author_fkey" FOREIGN KEY ("author") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionElement" ADD CONSTRAINT "DiscussionElement_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionEvent" ADD CONSTRAINT "DiscussionEvent_concernedUser_fkey" FOREIGN KEY ("concernedUser") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionEvent" ADD CONSTRAINT "DiscussionEvent_discussionElementId_fkey" FOREIGN KEY ("discussionElementId") REFERENCES "DiscussionElement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionMessage" ADD CONSTRAINT "DiscussionMessage_discussionElementId_fkey" FOREIGN KEY ("discussionElementId") REFERENCES "DiscussionElement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
