-- DropForeignKey
ALTER TABLE "DirectMessage" DROP CONSTRAINT "DirectMessage_requestedUserName_fkey";

-- DropForeignKey
ALTER TABLE "DirectMessage" DROP CONSTRAINT "DirectMessage_requestingUserName_fkey";

-- DropIndex
DROP INDEX "DirectMessage_requestingUserName_requestedUserName_key";

-- AlterTable
ALTER TABLE "DirectMessage" ALTER COLUMN "requestedUserName" DROP NOT NULL,
ALTER COLUMN "requestingUserName" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_requestingUserName_fkey" FOREIGN KEY ("requestingUserName") REFERENCES "User"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_requestedUserName_fkey" FOREIGN KEY ("requestedUserName") REFERENCES "User"("name") ON DELETE SET NULL ON UPDATE CASCADE;
