-- CreateTable
CREATE TABLE "_DiscussionMessageToRole" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_DiscussionMessageToRole_AB_unique" ON "_DiscussionMessageToRole"("A", "B");

-- CreateIndex
CREATE INDEX "_DiscussionMessageToRole_B_index" ON "_DiscussionMessageToRole"("B");

-- AddForeignKey
ALTER TABLE "_DiscussionMessageToRole" ADD CONSTRAINT "_DiscussionMessageToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "DiscussionMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DiscussionMessageToRole" ADD CONSTRAINT "_DiscussionMessageToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
