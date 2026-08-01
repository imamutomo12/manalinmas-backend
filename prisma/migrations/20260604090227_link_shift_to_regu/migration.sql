-- AlterTable
ALTER TABLE "shifts" ADD COLUMN     "regu_id" UUID;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_regu_id_fkey" FOREIGN KEY ("regu_id") REFERENCES "regu"("id") ON DELETE SET NULL ON UPDATE CASCADE;
