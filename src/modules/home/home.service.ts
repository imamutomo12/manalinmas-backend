import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IncidentStatus, Role } from '@prisma/client';

@Injectable()
export class HomeService {
  constructor(private prisma: PrismaService) {}

  // ===========================================================================
  // Helper
  // ===========================================================================

  private getTodayBounds() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
  }

  private formatTime(time: Date): string {
    return time.toISOString().substring(11, 16); // HH:mm
  }

  // ===========================================================================
  // KOORDINATOR
  // ===========================================================================

  async getKoordinatorHome() {
    const { start, end } = this.getTodayBounds();

    const [activeIncidents, totalLinmas, todayShifts] = await Promise.all([
      this.prisma.incident.count({
        where: {
          status: {
            in: [
              IncidentStatus.MENUNGGU,
              IncidentStatus.DITANGANI,
              IncidentStatus.DIALIHKAN,
            ],
          },
        },
      }),

      this.prisma.user.count({
        where: {
          role: Role.LINMAS,
        },
      }),

      this.prisma.shift.count({
        where: {
          shiftDate: {
            gte: start,
            lt: end,
          },
        },
      }),
    ]);

    return {
      role: Role.KOORDINATOR,
      summary: {
        active_incidents: activeIncidents,
        total_linmas: totalLinmas,
        today_shifts_count: todayShifts,
      },
    };
  }

  // ===========================================================================
  // LINMAS
  // ===========================================================================

  async getLinmasHome(userId: string) {
    const { start, end } = this.getTodayBounds();

    const [activeIncidents, myTodayShift, profile] = await Promise.all([
      this.prisma.incident.count({
        where: {
          status: {
            in: [IncidentStatus.MENUNGGU, IncidentStatus.DIALIHKAN],
          },
        },
      }),

      this.prisma.shiftAssignment.findFirst({
        where: {
          linmasId: userId,
          shift: {
            shiftDate: {
              gte: start,
              lt: end,
            },
          },
        },
        include: {
          shift: true,
        },
      }),

      this.prisma.linmasProfile.findUnique({
        where: {
          userId,
        },
        include: {
          regu: true,
        },
      }),
    ]);

    return {
      role: Role.LINMAS,
      summary: {
        regu_name: profile?.regu?.name ?? null,
        active_incidents: activeIncidents,
        has_shift_today: !!myTodayShift,

        shift_detail: myTodayShift
          ? {
              shift_date: myTodayShift.shift.shiftDate
                .toISOString()
                .split('T')[0],
              shift_type: myTodayShift.shift.shiftType,
              start_time: this.formatTime(myTodayShift.shift.startTime),
              end_time: this.formatTime(myTodayShift.shift.endTime),
            }
          : null,
      },
    };
  }

  // ===========================================================================
  // WARGA
  // ===========================================================================

  async getWargaHome(userId: string) {
    const activeReports = await this.prisma.incident.count({
      where: {
        reportedByWargaId: userId,
        status: {
          not: IncidentStatus.SELESAI,
        },
      },
    });

    return {
      role: Role.WARGA,
      summary: {
        my_active_reports: activeReports,
      },
    };
  }
}
