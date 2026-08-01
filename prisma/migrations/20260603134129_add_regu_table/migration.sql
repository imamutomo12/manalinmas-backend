-- AlterTable
ALTER TABLE "linmas_profiles" ADD COLUMN     "regu_id" UUID;

-- CreateTable
CREATE TABLE "regu" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regu_name_key" ON "regu"("name");

-- AddForeignKey
ALTER TABLE "linmas_profiles" ADD CONSTRAINT "linmas_profiles_regu_id_fkey" FOREIGN KEY ("regu_id") REFERENCES "regu"("id") ON DELETE SET NULL ON UPDATE CASCADE;
