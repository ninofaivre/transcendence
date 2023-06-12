-- AlterTable
ALTER TABLE "ChanInvitation" ADD COLUMN     "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "modificationDate" TIMESTAMP(3);
