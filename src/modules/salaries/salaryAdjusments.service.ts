import { BadRequestException, Injectable } from '@nestjs/common';
import { AttendanceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type AdjustmentDetail = {
  reason: string;
  date: string;
  amount: number;
  source_type: string;
  source_id: string;
};

type AdjustmentRecapRecord = {
  linmas_id: string;
  full_name: string;
  regu_name: string | null;
  total_bonuses: number;
  total_deductions: number;
  net_adjustment: number;
  is_approved: boolean;
  approved_at: string | null;
  bonus_details: AdjustmentDetail[];
  deduction_details: AdjustmentDetail[];
};

@Injectable()
export class SalaryAdjustmentsService {
  private readonly BONUS_AMOUNT = 50000;
  private readonly DEDUCTION_AMOUNT = 50000;

  constructor(private readonly prisma: PrismaService) {}

  async buildAdjustmentRecap(month: number, year: number, linmasId?: string) {
    if (!month || !year) {
      throw new BadRequestException('Month and year are required');
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Perbaikan: gunakan linmasProfile untuk AttendanceSession
    const includeQuery = {
      linmasProfile: { include: { regu: true } },
      shiftAssignment: { include: { shift: true } },
    };

    const absences = await this.prisma.attendanceSession.findMany({
      where: {
        linmasProfileUserId: linmasId ? linmasId : undefined, // Perbaikan
        status: AttendanceStatus.ABSENT,
        shiftAssignment: {
          shift: { shiftDate: { gte: startDate, lt: endDate } },
        },
      },
      include: includeQuery,
    });

    const substitutes = await this.prisma.shiftAssignment.findMany({
      where: {
        linmasId: linmasId ? linmasId : undefined, // ShiftAssignment tetap linmasId
        isSubstitute: true,
        shift: { shiftDate: { gte: startDate, lt: endDate } },
      },
      include: { linmas: { include: { regu: true } }, shift: true },
    });

    const recapMap = new Map<string, AdjustmentRecapRecord>();

    // Mapping Absences (Dari AttendanceSession)
    for (const session of absences) {
      const lId = session.linmasProfileUserId; // Perbaikan
      if (!lId) continue;

      if (!recapMap.has(lId)) {
        recapMap.set(
          lId,
          this.createEmptyRecord(
            lId,
            session.linmasProfile!.fullName, // Perbaikan
            session.linmasProfile!.regu?.name || null, // Perbaikan
          ),
        );
      }

      const record = recapMap.get(lId)!;
      record.total_deductions += this.DEDUCTION_AMOUNT;
      record.deduction_details.push({
        reason: 'Unexcused Absence',
        date: session.shiftAssignment.shift.shiftDate
          .toISOString()
          .split('T')[0],
        amount: this.DEDUCTION_AMOUNT,
        source_type: 'ATTENDANCE_SESSION',
        source_id: session.id,
      });
    }

    // Mapping Substitutes (Dari ShiftAssignment)
    for (const assign of substitutes) {
      const lId = assign.linmasId;

      if (!recapMap.has(lId)) {
        recapMap.set(
          lId,
          this.createEmptyRecord(
            lId,
            assign.linmas.fullName,
            assign.linmas.regu?.name || null,
          ),
        );
      }

      const record = recapMap.get(lId)!;
      record.total_bonuses += this.BONUS_AMOUNT;
      record.bonus_details.push({
        reason: 'Substitute Shift',
        date: assign.shift.shiftDate.toISOString().split('T')[0],
        amount: this.BONUS_AMOUNT,
        source_type: 'SHIFT_ASSIGNMENT',
        source_id: assign.id,
      });
    }

    return Array.from(recapMap.values()).map((record) => ({
      ...record,
      net_adjustment: record.total_bonuses - record.total_deductions,
    }));
  }

  async saveMonthlyAdjustmentRecap(
    month: number,
    year: number,
    linmasId?: string,
  ) {
    const recap = await this.buildAdjustmentRecap(month, year, linmasId);

    await this.prisma.$transaction(async (tx) => {
      for (const record of recap) {
        const period = await tx.salaryAdjustmentPeriod.upsert({
          where: {
            linmasId_month_year: {
              linmasId: record.linmas_id,
              month,
              year,
            },
          },
          create: {
            linmasId: record.linmas_id,
            month,
            year,
            totalBonuses: record.total_bonuses,
            totalDeductions: record.total_deductions,
            netAdjustment: record.net_adjustment,
            isApproved: false,
            approvedAt: null,
            approvedByKoorId: null,
          },
          update: {
            totalBonuses: record.total_bonuses,
            totalDeductions: record.total_deductions,
            netAdjustment: record.net_adjustment,
            isApproved: false,
            approvedAt: null,
            approvedByKoorId: null,
          },
        });

        await tx.salaryAdjustmentItem.deleteMany({
          where: { periodId: period.id },
        });

        const detailRows = [
          ...record.bonus_details.map((item) => ({
            periodId: period.id,
            adjustmentKind: 'BONUS' as const,
            sourceType: item.source_type,
            sourceId: item.source_id,
            reason: item.reason,
            amount: item.amount,
            occurredAt: new Date(item.date),
          })),
          ...record.deduction_details.map((item) => ({
            periodId: period.id,
            adjustmentKind: 'DEDUCTION' as const,
            sourceType: item.source_type,
            sourceId: item.source_id,
            reason: item.reason,
            amount: item.amount,
            occurredAt: new Date(item.date),
          })),
        ];

        if (detailRows.length > 0) {
          await tx.salaryAdjustmentItem.createMany({
            data: detailRows,
          });
        }
      }
    });

    return this.getSavedMonthlyAdjustmentRecap(month, year, linmasId);
  }

  async getSavedMonthlyAdjustmentRecap(
    month: number,
    year: number,
    linmasId?: string,
  ) {
    if (!month || !year) {
      throw new BadRequestException('Month and year are required');
    }

    const periods = await this.prisma.salaryAdjustmentPeriod.findMany({
      where: {
        month,
        year,
        linmasId: linmasId ? linmasId : undefined,
      },
      include: {
        linmas: { include: { regu: true } }, // SalaryAdjustmentPeriod tetap linmas
        items: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return periods.map((period) => ({
      linmas_id: period.linmasId,
      full_name: period.linmas.fullName,
      regu_name: period.linmas.regu?.name || null,
      total_bonuses: period.totalBonuses,
      total_deductions: period.totalDeductions,
      net_adjustment: period.netAdjustment,
      is_approved: period.isApproved,
      approved_at: period.approvedAt ? period.approvedAt.toISOString() : null,
      bonus_details: period.items
        .filter((item) => item.adjustmentKind === 'BONUS')
        .map((item) => ({
          reason: item.reason,
          date: item.occurredAt.toISOString().split('T')[0],
          amount: item.amount,
          source_type: item.sourceType,
          source_id: item.sourceId,
        })),
      deduction_details: period.items
        .filter((item) => item.adjustmentKind === 'DEDUCTION')
        .map((item) => ({
          reason: item.reason,
          date: item.occurredAt.toISOString().split('T')[0],
          amount: item.amount,
          source_type: item.sourceType,
          source_id: item.sourceId,
        })),
    }));
  }

  async setApproval(periodId: string, approved: boolean, approverId: string) {
    const period = await this.prisma.salaryAdjustmentPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      throw new BadRequestException('Salary adjustment period not found');
    }

    await this.prisma.salaryAdjustmentPeriod.update({
      where: { id: periodId },
      data: {
        isApproved: approved,
        approvedAt: approved ? new Date() : null,
        approvedByKoorId: approved ? approverId : null,
      },
    });

    return { success: true, approved };
  }

  private createEmptyRecord(
    linmasId: string,
    fullName: string,
    reguName: string | null,
  ): AdjustmentRecapRecord {
    return {
      linmas_id: linmasId,
      full_name: fullName,
      regu_name: reguName,
      total_bonuses: 0,
      total_deductions: 0,
      net_adjustment: 0,
      is_approved: false,
      approved_at: null,
      bonus_details: [],
      deduction_details: [],
    };
  }
}
