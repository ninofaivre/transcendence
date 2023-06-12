/*
  Warnings:

  - Made the column `status` on table `DirectMessage` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DirectMessage" ALTER COLUMN "status" SET NOT NULL;
