/*
  Warnings:

  - The `permissions` column on the `Role` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `roleApplyingType` on the `Role` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "RoleApplyingType" AS ENUM ('SELF', 'ROLES', 'ALL_EXCEPT_ROLES');

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "permissions",
ADD COLUMN     "permissions" "PermissionList"[],
DROP COLUMN "roleApplyingType",
ADD COLUMN     "roleApplyingType" "RoleApplyingType" NOT NULL;

-- DropEnum
DROP TYPE "role_applying_type";
