/*
  Warnings:

  - You are about to drop the `Friendship` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_friendName_fkey";

-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_userName_fkey";

-- DropTable
DROP TABLE "Friendship";
