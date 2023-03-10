-- CreateTable
CREATE TABLE "_friendList" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_friendInvitation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_blockedUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_friendList_AB_unique" ON "_friendList"("A", "B");

-- CreateIndex
CREATE INDEX "_friendList_B_index" ON "_friendList"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_friendInvitation_AB_unique" ON "_friendInvitation"("A", "B");

-- CreateIndex
CREATE INDEX "_friendInvitation_B_index" ON "_friendInvitation"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_blockedUser_AB_unique" ON "_blockedUser"("A", "B");

-- CreateIndex
CREATE INDEX "_blockedUser_B_index" ON "_blockedUser"("B");

-- AddForeignKey
ALTER TABLE "_friendList" ADD CONSTRAINT "_friendList_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_friendList" ADD CONSTRAINT "_friendList_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_friendInvitation" ADD CONSTRAINT "_friendInvitation_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_friendInvitation" ADD CONSTRAINT "_friendInvitation_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_blockedUser" ADD CONSTRAINT "_blockedUser_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_blockedUser" ADD CONSTRAINT "_blockedUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;
