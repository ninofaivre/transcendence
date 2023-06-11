/*
  Warnings:

  - The values [CHAN_INVITATION] on the enum `EventType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventType_new" AS ENUM ('AUTHOR_LEAVED', 'AUTHOR_KICKED_CONCERNED', 'AUTHOR_JOINED', 'MESSAGE_DELETED', 'PENDING_CHAN_INVITATION', 'CANCELED_CHAN_INVITATION', 'REFUSED_CHAN_INVITATION', 'CHAN_DELETED_INVITATION');
ALTER TABLE "DiscussionEvent" ALTER COLUMN "eventType" TYPE "EventType_new" USING ("eventType"::text::"EventType_new");
ALTER TYPE "EventType" RENAME TO "EventType_old";
ALTER TYPE "EventType_new" RENAME TO "EventType";
DROP TYPE "EventType_old";
COMMIT;
