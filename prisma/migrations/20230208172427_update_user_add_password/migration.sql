/*
  Warnings:

  - You are about to drop the column `hashedPass` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "hashedPass",
ADD COLUMN     "password" TEXT;
