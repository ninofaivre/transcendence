/*
  Warnings:

  - The `status` column on the `DirectMessage` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DirectMessageStatus" AS ENUM ('ENABLED', 'DISABLED');

-- AlterTable
ALTER TABLE "DirectMessage" DROP COLUMN "status",
ADD COLUMN     "status" "DirectMessageStatus" DEFAULT 'ENABLED';

-- DropEnum
DROP TYPE "DirectMessageStatuss";
