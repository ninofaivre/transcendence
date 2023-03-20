/*
  Warnings:

  - The values [PRIVATE,PUBLIC] on the enum `ChanType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ChanType_new" AS ENUM ('PRIVATE_CHAN', 'PUBLIC_CHAN');
ALTER TABLE "Chan" ALTER COLUMN "type" TYPE "ChanType_new" USING ("type"::text::"ChanType_new");
ALTER TYPE "ChanType" RENAME TO "ChanType_old";
ALTER TYPE "ChanType_new" RENAME TO "ChanType";
DROP TYPE "ChanType_old";
COMMIT;
