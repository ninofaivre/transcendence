/*
  Warnings:

  - The values [EDIT_TITLE,EDIT_PASSWORD,EDIT_VISIBILITY] on the enum `PermissionList` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PermissionList_new" AS ENUM ('SEND_MESSAGE', 'DELETE_MESSAGE', 'EDIT', 'INVITE', 'KICK', 'BAN', 'MUTE', 'DESTROY');
ALTER TABLE "Role" ALTER COLUMN "permissions" TYPE "PermissionList_new"[] USING ("permissions"::text::"PermissionList_new"[]);
ALTER TYPE "PermissionList" RENAME TO "PermissionList_old";
ALTER TYPE "PermissionList_new" RENAME TO "PermissionList";
DROP TYPE "PermissionList_old";
COMMIT;
