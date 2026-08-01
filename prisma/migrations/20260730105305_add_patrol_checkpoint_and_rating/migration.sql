/*
  Warnings:

  - Added the required column `geofence_radius` to the `attendance_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "attendance_logs" ADD COLUMN     "distance_meters" DECIMAL(6,2),
ADD COLUMN     "geofence_radius" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "attendance_sessions" ADD COLUMN     "completed_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "incidents" ADD COLUMN     "handled_at" TIMESTAMP(3),
ADD COLUMN     "linmasProfileUserId" UUID,
ADD COLUMN     "resolved_at" TIMESTAMP(3),
ADD COLUMN     "resolved_by_id" UUID;

-- CreateTable
CREATE TABLE "patrol_checkpoints" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "radius_meters" INTEGER NOT NULL,
    "block" VARCHAR(20),
    "rt" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patrol_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patrol_visits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attendance_session_id" UUID NOT NULL,
    "checkpoint_id" UUID NOT NULL,
    "entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "visit_count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "patrol_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_ratings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "incident_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "review" TEXT,
    "rated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patrol_visits_attendance_session_id_checkpoint_id_key" ON "patrol_visits"("attendance_session_id", "checkpoint_id");

-- CreateIndex
CREATE UNIQUE INDEX "incident_ratings_incident_id_key" ON "incident_ratings"("incident_id");

-- AddForeignKey
ALTER TABLE "patrol_visits" ADD CONSTRAINT "patrol_visits_attendance_session_id_fkey" FOREIGN KEY ("attendance_session_id") REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrol_visits" ADD CONSTRAINT "patrol_visits_checkpoint_id_fkey" FOREIGN KEY ("checkpoint_id") REFERENCES "patrol_checkpoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_linmasProfileUserId_fkey" FOREIGN KEY ("linmasProfileUserId") REFERENCES "linmas_profiles"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_ratings" ADD CONSTRAINT "incident_ratings_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
