/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "_DiscussionToUser" DROP CONSTRAINT "_DiscussionToUser_B_fkey";

-- DropIndex
DROP INDEX "User_name_key";

-- AlterTable
ALTER TABLE "Discussion" ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("name");

-- AlterTable
ALTER TABLE "_DiscussionToUser" ALTER COLUMN "B" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "_DiscussionToUser" ADD CONSTRAINT "_DiscussionToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("name") ON DELETE CASCADE ON UPDATE CASCADE;
