-- AlterTable
ALTER TABLE "DiscussionMessage" ADD COLUMN     "relatedId" INTEGER;

-- AddForeignKey
ALTER TABLE "DiscussionMessage" ADD CONSTRAINT "DiscussionMessage_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "DiscussionElement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
