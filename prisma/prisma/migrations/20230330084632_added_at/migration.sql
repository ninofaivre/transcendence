-- CreateTable
CREATE TABLE "_DiscussionMessageToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_DiscussionMessageToUser_AB_unique" ON "_DiscussionMessageToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_DiscussionMessageToUser_B_index" ON "_DiscussionMessageToUser"("B");

-- AddForeignKey
ALTER TABLE "_DiscussionMessageToUser" ADD CONSTRAINT "_DiscussionMessageToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "DiscussionMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DiscussionMessageToUser" ADD CONSTRAINT "_DiscussionMessageToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;
