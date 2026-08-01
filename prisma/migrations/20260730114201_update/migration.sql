/*
  Warnings:

  - You are about to drop the column `linmas_id` on the `attendance_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `cdn_url` on the `files` table. All the data in the column will be lost.
  - Added the required column `file_key` to the `files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `original_name` to the `files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storage_key` to the `files` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "attendance_sessions" DROP CONSTRAINT "attendance_sessions_linmas_id_fkey";

-- AlterTable
ALTER TABLE "attendance_sessions" DROP COLUMN "linmas_id",
ADD COLUMN     "linmasProfileUserId" UUID;

-- AlterTable
ALTER TABLE "files" DROP COLUMN "cdn_url",
ADD COLUMN     "file_key" VARCHAR(255) NOT NULL,
ADD COLUMN     "original_name" VARCHAR(255) NOT NULL,
ADD COLUMN     "storage_key" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_linmasProfileUserId_fkey" FOREIGN KEY ("linmasProfileUserId") REFERENCES "linmas_profiles"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
