/*
  Warnings:

  - You are about to drop the column `visit_count` on the `patrol_visits` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "patrol_visits_attendance_session_id_checkpoint_id_key";

-- AlterTable
ALTER TABLE "patrol_visits" DROP COLUMN "visit_count";

-- CreateIndex
CREATE INDEX "patrol_visits_attendance_session_id_checkpoint_id_idx" ON "patrol_visits"("attendance_session_id", "checkpoint_id");
