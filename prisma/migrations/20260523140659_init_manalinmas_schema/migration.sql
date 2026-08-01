-- CreateEnum
CREATE TYPE "Role" AS ENUM ('KOORDINATOR', 'LINMAS', 'WARGA');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('MORNING', 'NIGHT');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE');

-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('CLOCK_IN', 'CLOCK_OUT');

-- CreateEnum
CREATE TYPE "GeofenceStatus" AS ENUM ('VERIFIED_INSIDE', 'VERIFIED_OUTSIDE', 'GPS_NOT_AVAILABLE');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('MENUNGGU', 'DITANGANI', 'SELESAI', 'DIALIHKAN');

-- CreateEnum
CREATE TYPE "ResponseType" AS ENUM ('CLAIMED', 'INTERVENED');

-- CreateEnum
CREATE TYPE "PatrolType" AS ENUM ('SUSPICIOUS_OBJECT', 'FACILITY_DAMAGE', 'POTENTIAL_HAZARD');

-- CreateEnum
CREATE TYPE "SanctionLevel" AS ENUM ('SP1', 'SP2', 'SP3');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role" "Role" NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "fcm_token" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warga_profiles" (
    "user_id" UUID NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "warga_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "linmas_profiles" (
    "user_id" UUID NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "address" TEXT NOT NULL,
    "employment_date" DATE NOT NULL,

    CONSTRAINT "linmas_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "koordinator_profiles" (
    "user_id" UUID NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "appointment_date" DATE NOT NULL,

    CONSTRAINT "koordinator_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cdn_url" VARCHAR(512) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shift_date" DATE NOT NULL,
    "shift_type" "ShiftType" NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "shift_id" UUID NOT NULL,
    "linmas_id" UUID NOT NULL,
    "is_substitute" BOOLEAN NOT NULL DEFAULT false,
    "original_linmas_id" UUID,

    CONSTRAINT "shift_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "linmas_id" UUID NOT NULL,
    "shift_assignment_id" UUID NOT NULL,
    "status" "AttendanceStatus" NOT NULL,

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "log_type" "LogType" NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "geofence_status" "GeofenceStatus" NOT NULL,
    "photo_file_id" UUID NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reported_by_warga_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'MENUNGGU',
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "photo_file_id" UUID NOT NULL,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_responses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "incident_id" UUID NOT NULL,
    "responder_id" UUID NOT NULL,
    "response_type" "ResponseType" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patrol_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "linmas_id" UUID NOT NULL,
    "patrol_type" "PatrolType" NOT NULL,
    "description" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "photo_file_id" UUID NOT NULL,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patrol_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "violations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "linmas_id" UUID NOT NULL,
    "issued_by_koor_id" UUID NOT NULL,
    "violation_type" VARCHAR(255) NOT NULL,
    "sanction_level" "SanctionLevel" NOT NULL,
    "incident_date" DATE NOT NULL,

    CONSTRAINT "violations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_logs_photo_file_id_key" ON "attendance_logs"("photo_file_id");

-- CreateIndex
CREATE UNIQUE INDEX "incidents_photo_file_id_key" ON "incidents"("photo_file_id");

-- CreateIndex
CREATE UNIQUE INDEX "patrol_reports_photo_file_id_key" ON "patrol_reports"("photo_file_id");

-- AddForeignKey
ALTER TABLE "warga_profiles" ADD CONSTRAINT "warga_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linmas_profiles" ADD CONSTRAINT "linmas_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koordinator_profiles" ADD CONSTRAINT "koordinator_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_linmas_id_fkey" FOREIGN KEY ("linmas_id") REFERENCES "linmas_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_original_linmas_id_fkey" FOREIGN KEY ("original_linmas_id") REFERENCES "linmas_profiles"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_linmas_id_fkey" FOREIGN KEY ("linmas_id") REFERENCES "linmas_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_shift_assignment_id_fkey" FOREIGN KEY ("shift_assignment_id") REFERENCES "shift_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_photo_file_id_fkey" FOREIGN KEY ("photo_file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reported_by_warga_id_fkey" FOREIGN KEY ("reported_by_warga_id") REFERENCES "warga_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_photo_file_id_fkey" FOREIGN KEY ("photo_file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_responses" ADD CONSTRAINT "incident_responses_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_responses" ADD CONSTRAINT "incident_responses_responder_id_fkey" FOREIGN KEY ("responder_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrol_reports" ADD CONSTRAINT "patrol_reports_linmas_id_fkey" FOREIGN KEY ("linmas_id") REFERENCES "linmas_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrol_reports" ADD CONSTRAINT "patrol_reports_photo_file_id_fkey" FOREIGN KEY ("photo_file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_linmas_id_fkey" FOREIGN KEY ("linmas_id") REFERENCES "linmas_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_issued_by_koor_id_fkey" FOREIGN KEY ("issued_by_koor_id") REFERENCES "koordinator_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
