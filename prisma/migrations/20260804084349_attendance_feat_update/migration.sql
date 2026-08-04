-- AlterEnum
ALTER TYPE "AttendanceStatus" ADD VALUE 'EXCUSED';

-- AlterTable
ALTER TABLE "attendance_sessions" ADD COLUMN     "excuse_note" TEXT;
