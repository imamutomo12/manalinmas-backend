import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class SalariesService {
  private readonly BONUS_AMOUNT = 50000;
  private readonly DEDUCTION_AMOUNT = 50000;

  constructor(private prisma: PrismaService) {}

  async calculateAdjustmentRecap(
    month: number,
    year: number,
    linmasId?: string,
  ) {
    if (!month || !year)
      throw new BadRequestException('Month and year are required');
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Perbaikan: gunakan linmasProfile untuk AttendanceSession
    const includeQuery = {
      linmasProfile: { include: { regu: true } },
      shiftAssignment: { include: { shift: true } },
    };

    const absences = await this.prisma.attendanceSession.findMany({
      where: {
        linmasProfileUserId: linmasId ? linmasId : undefined, // Perbaikan: linmasProfileUserId
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
      include: {
        linmas: { include: { regu: true } }, // ShiftAssignment tetap linmas
        shift: true,
      },
    });

    const recapMap = new Map();

    // Mapping Absences (Dari AttendanceSession)
    for (const session of absences) {
      const lId = session.linmasProfileUserId; // Perbaikan
      if (!lId) continue;

      if (!recapMap.has(lId)) {
        const rName = session.linmasProfile?.regu?.name || null; // Perbaikan
        recapMap.set(
          lId,
          this.createEmptyRecord(lId, session.linmasProfile!.fullName, rName), // Perbaikan
        );
      }
      const record = recapMap.get(lId);
      record.total_deductions += this.DEDUCTION_AMOUNT;
      record.deduction_details.push({
        reason: 'Unexcused Absence',
        date: session.shiftAssignment.shift.shiftDate
          .toISOString()
          .split('T')[0],
        amount: this.DEDUCTION_AMOUNT,
      });
    }

    // Mapping Substitutes (Dari ShiftAssignment)
    for (const assign of substitutes) {
      const lId = assign.linmasId;
      if (!recapMap.has(lId)) {
        const rName = assign.linmas.regu?.name || null;
        recapMap.set(
          lId,
          this.createEmptyRecord(lId, assign.linmas.fullName, rName),
        );
      }
      const record = recapMap.get(lId);
      record.total_bonuses += this.BONUS_AMOUNT;
      record.bonus_details.push({
        reason: 'Substitute Shift',
        date: assign.shift.shiftDate.toISOString().split('T')[0],
        amount: this.BONUS_AMOUNT,
      });
    }

    return Array.from(recapMap.values()).map((record) => ({
      ...record,
      net_adjustment: record.total_bonuses - record.total_deductions,
    }));
  }

  private createEmptyRecord(
    linmasId: string,
    fullName: string,
    reguName: string | null,
  ) {
    return {
      linmas_id: linmasId,
      full_name: fullName,
      regu_name: reguName,
      total_bonuses: 0,
      total_deductions: 0,
      net_adjustment: 0,
      bonus_details: [],
      deduction_details: [],
    };
  }
}
