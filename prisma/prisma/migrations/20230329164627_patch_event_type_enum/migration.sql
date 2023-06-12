/*
  Warnings:

  - Changed the type of `eventType` on the `DiscussionEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('AUTHOR_LEAVED', 'AUTHOR_KICKED_CONCERNED', 'AUTHOR_JOINED', 'MESSAGE_DELETED');

-- AlterTable
ALTER TABLE "DiscussionEvent" DROP COLUMN "eventType",
ADD COLUMN     "eventType" "EventType" NOT NULL;

-- DropEnum
DROP TYPE "EventTypeEnum";
