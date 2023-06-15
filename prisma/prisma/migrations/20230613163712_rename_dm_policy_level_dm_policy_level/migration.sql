/*
  Warnings:

  - The `dmPolicyLevel` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DmPolicyLevelType" AS ENUM ('ONLY_FRIEND', 'IN_COMMON_CHAN', 'ANYONE');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "dmPolicyLevel",
ADD COLUMN     "dmPolicyLevel" "DmPolicyLevelType" NOT NULL DEFAULT 'ONLY_FRIEND';

-- DropEnum
DROP TYPE "dmPolicyLevelType";
