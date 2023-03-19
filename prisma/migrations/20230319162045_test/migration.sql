-- CreateEnum
CREATE TYPE "ChanType" AS ENUM ('PRIVATE', 'PUBLIC');

-- DropEnum
DROP TYPE "DiscussionType";

-- CreateTable
CREATE TABLE "Chan" (
    "id" SERIAL NOT NULL,
    "type" "ChanType" NOT NULL,
    "title" TEXT,
    "password" TEXT,
    "discussionId" INTEGER NOT NULL,

    CONSTRAINT "Chan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_chan" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Chan_discussionId_key" ON "Chan"("discussionId");

-- CreateIndex
CREATE UNIQUE INDEX "_chan_AB_unique" ON "_chan"("A", "B");

-- CreateIndex
CREATE INDEX "_chan_B_index" ON "_chan"("B");

-- AddForeignKey
ALTER TABLE "Chan" ADD CONSTRAINT "Chan_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_chan" ADD CONSTRAINT "_chan_A_fkey" FOREIGN KEY ("A") REFERENCES "Chan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_chan" ADD CONSTRAINT "_chan_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;
