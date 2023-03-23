/*
  Warnings:

  - You are about to drop the column `perm` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the `_PermissionToRole` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PermissionToRole" DROP CONSTRAINT "_PermissionToRole_A_fkey";

-- DropForeignKey
ALTER TABLE "_PermissionToRole" DROP CONSTRAINT "_PermissionToRole_B_fkey";

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "perm",
ADD COLUMN     "roleId" INTEGER;

-- DropTable
DROP TABLE "_PermissionToRole";

-- CreateTable
CREATE TABLE "_permissionsOnMe" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_permissionsOnMe_AB_unique" ON "_permissionsOnMe"("A", "B");

-- CreateIndex
CREATE INDEX "_permissionsOnMe_B_index" ON "_permissionsOnMe"("B");

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_permissionsOnMe" ADD CONSTRAINT "_permissionsOnMe_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_permissionsOnMe" ADD CONSTRAINT "_permissionsOnMe_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
