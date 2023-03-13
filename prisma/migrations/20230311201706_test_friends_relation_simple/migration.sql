-- CreateTable
CREATE TABLE "Friendship" (
    "friendOneName" TEXT NOT NULL,
    "friendTwoName" TEXT NOT NULL,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("friendOneName","friendTwoName")
);

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_friendOneName_fkey" FOREIGN KEY ("friendOneName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_friendTwoName_fkey" FOREIGN KEY ("friendTwoName") REFERENCES "User"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
