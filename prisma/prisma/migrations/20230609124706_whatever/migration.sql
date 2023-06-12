/*
  Warnings:

  - The values [DELETED_MESSAGE] on the enum `ClassicChanEventType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ClassicChanEventType_new" AS ENUM ('AUTHOR_LEAVED', 'AUTHOR_KICKED_CONCERNED', 'AUTHOR_JOINED', 'AUTHOR_MUTED_CONCERNED');
ALTER TABLE "ClassicChanDiscussionEvent" ALTER COLUMN "eventType" TYPE "ClassicChanEventType_new" USING ("eventType"::text::"ClassicChanEventType_new");
ALTER TYPE "ClassicChanEventType" RENAME TO "ClassicChanEventType_old";
ALTER TYPE "ClassicChanEventType_new" RENAME TO "ClassicChanEventType";
DROP TYPE "ClassicChanEventType_old";
COMMIT;
