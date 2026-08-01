-- CreateEnum
CREATE TYPE "SalaryAdjustmentKind" AS ENUM ('BONUS', 'DEDUCTION');

-- CreateTable
CREATE TABLE "salary_adjustment_periods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "linmas_id" UUID NOT NULL,
    "approved_by_koor_id" UUID,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "total_bonuses" INTEGER NOT NULL DEFAULT 0,
    "total_deductions" INTEGER NOT NULL DEFAULT 0,
    "net_adjustment" INTEGER NOT NULL DEFAULT 0,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_adjustment_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_adjustment_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "period_id" UUID NOT NULL,
    "adjustment_kind" "SalaryAdjustmentKind" NOT NULL,
    "source_type" VARCHAR(50),
    "source_id" UUID,
    "reason" VARCHAR(255) NOT NULL,
    "amount" INTEGER NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_adjustment_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "salary_adjustment_periods_linmas_id_month_year_key" ON "salary_adjustment_periods"("linmas_id", "month", "year");

-- AddForeignKey
ALTER TABLE "salary_adjustment_periods" ADD CONSTRAINT "salary_adjustment_periods_linmas_id_fkey" FOREIGN KEY ("linmas_id") REFERENCES "linmas_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_adjustment_periods" ADD CONSTRAINT "salary_adjustment_periods_approved_by_koor_id_fkey" FOREIGN KEY ("approved_by_koor_id") REFERENCES "koordinator_profiles"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_adjustment_items" ADD CONSTRAINT "salary_adjustment_items_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "salary_adjustment_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
