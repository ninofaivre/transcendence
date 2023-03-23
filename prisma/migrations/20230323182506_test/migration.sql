/*
  Warnings:

  - You are about to drop the `Permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_permissionsOnMe` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `roleApplyingType` to the `Role` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "role_applying_type" AS ENUM ('SELF', 'ROLES', 'ALL_EXCEPT_ROLES');

-- DropForeignKey
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_roleId_fkey";

-- DropForeignKey
ALTER TABLE "_permissionsOnMe" DROP CONSTRAINT "_permissionsOnMe_A_fkey";

-- DropForeignKey
ALTER TABLE "_permissionsOnMe" DROP CONSTRAINT "_permissionsOnMe_B_fkey";

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "permissions" "role_applying_type"[],
ADD COLUMN     "roleApplyingType" "role_applying_type" NOT NULL;

-- DropTable
DROP TABLE "Permission";

-- DropTable
DROP TABLE "_permissionsOnMe";

-- CreateTable
CREATE TABLE "_roles" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_roles_AB_unique" ON "_roles"("A", "B");

-- CreateIndex
CREATE INDEX "_roles_B_index" ON "_roles"("B");

-- AddForeignKey
ALTER TABLE "_roles" ADD CONSTRAINT "_roles_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_roles" ADD CONSTRAINT "_roles_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
