-- CreateEnum
CREATE TYPE "StatusVisibilityLevel" AS ENUM ('NO_ONE', 'ONLY_FRIEND', 'IN_COMMON_CHAN', 'ANYONE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "statusVisibilityLevel" "StatusVisibilityLevel" NOT NULL DEFAULT 'ONLY_FRIEND';
