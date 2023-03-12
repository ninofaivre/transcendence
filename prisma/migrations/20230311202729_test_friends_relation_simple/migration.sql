/*
  Warnings:

  - The primary key for the `Friendship` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `friendOneName` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `friendTwoName` on the `Friendship` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userName,friendName]` on the table `Friendship` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `friendName` to the `Friendship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userName` to the `Friendship` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_friendOneName_fkey";

-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_friendTwoName_fkey";

-- AlterTable
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_pkey",
DROP COLUMN "friendOneName",
DROP COLUMN "friendTwoName",
ADD COLUMN     "friendName" TEXT NOT NULL,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "userName" TEXT NOT NULL,
ADD CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_userName_friendName_key" ON "Friendship"("userName", "friendName");

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userName_fkey" FOREIGN KEY ("userName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_friendName_fkey" FOREIGN KEY ("friendName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
