-- CreateEnum
CREATE TYPE "dmPolicyLevelType" AS ENUM ('ONLY_FRIEND', 'IN_COMMON_CHAN', 'ANYONE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ClassicDmEventType" ADD VALUE 'DISABLED_DM';
ALTER TYPE "ClassicDmEventType" ADD VALUE 'ENABLED_DM';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dmPolicyLevel" "dmPolicyLevelType" NOT NULL DEFAULT 'ONLY_FRIEND';
