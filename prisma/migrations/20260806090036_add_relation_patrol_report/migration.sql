-- AlterTable
ALTER TABLE "patrol_reports" ADD COLUMN     "attendance_session_id" UUID;

-- AddForeignKey
ALTER TABLE "patrol_reports" ADD CONSTRAINT "patrol_reports_attendance_session_id_fkey" FOREIGN KEY ("attendance_session_id") REFERENCES "attendance_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
