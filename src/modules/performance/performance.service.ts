// src/modules/performance/performance.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Role,
  IncidentStatus,
  ShiftType,
  AttendanceStatus,
  LogType,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import { StorageService } from '../storage/storage.service'; // Import StorageService

@Injectable()
export class PerformanceService {
  private readonly BONUS_PER_SUBSTITUTION = 50000; // RP 50,000
  private readonly DEDUCTION_PER_ABSENCE = 50000; // RP 50,000

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService, // Inject StorageService
  ) {}

  // ========================
  // MONTHLY PERFORMANCE (Enhanced with Adjustments)
  // ========================
  async getMonthlyEvaluation(
    month: number,
    year: number,
    specificLinmasId?: string,
  ) {
    if (!month || !year || month < 1 || month > 12)
      throw new BadRequestException(
        'Valid month (1-12) and year are required.',
      );

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // 1. Fetch target Linmas members
    const linmasList = await this.prisma.user.findMany({
      where: {
        role: Role.LINMAS,
        ...(specificLinmasId ? { id: specificLinmasId } : {}),
      },
      include: { linmasProfile: true },
    });

    // 2. Get total number of checkpoints for patrol calculation
    const totalCheckpoints = await this.prisma.patrolCheckpoint.count();

    const evaluations: Record<string, any>[] = [];

    for (const linmas of linmasList) {
      // --- MEASURE ATTENDANCE & PATROL ---
      const assignments = await this.prisma.shiftAssignment.findMany({
        where: {
          linmasId: linmas.id,
          shift: { shiftDate: { gte: startDate, lt: endDate } },
        },
        include: {
          shift: true, // Include shift details for date/type
          attendanceSessions: {
            include: { visits: true },
          },
        },
      });

      let totalScheduledShifts = assignments.length;
      let validAttendances = 0;
      let shiftsMeetingPatrolStandards = 0;

      for (const assignment of assignments) {
        const session = assignment.attendanceSessions[0];

        // Criteria for Valid Attendance: Clock-In and Clock-Out recorded OR Excused
        if (
          session &&
          (session.completedAt || session.status === AttendanceStatus.EXCUSED)
        ) {
          validAttendances++;

          // Check patrol completeness for this session (only if not excused)
          if (session.status !== AttendanceStatus.EXCUSED) {
            const uniqueVisitedCheckpoints = new Set(
              session.visits.map((v) => v.checkpointId),
            ).size;

            if (
              totalCheckpoints > 0 &&
              uniqueVisitedCheckpoints >= totalCheckpoints
            ) {
              shiftsMeetingPatrolStandards++;
            }
          }
        }
      }

      // --- MEASURE CITIZEN SERVICE ---
      const incidentsHandled = await this.prisma.incident.findMany({
        where: {
          linmasProfileUserId: linmas.id,
          status: IncidentStatus.SELESAI,
          resolvedAt: { gte: startDate, lt: endDate },
        },
        include: { rating: true },
      });

      let reportsHandledWithRating = 0;
      let totalRatingScore = 0;

      for (const incident of incidentsHandled) {
        if (incident.rating) {
          reportsHandledWithRating++;
          totalRatingScore += incident.rating.rating;
        }
      }

      let avgRating =
        reportsHandledWithRating > 0
          ? totalRatingScore / reportsHandledWithRating
          : 0;

      // --- COUNT SUBSTITUTIONS FOR BONUS ---
      const substitutionCount = assignments.filter(
        (a) => a.isSubstitute,
      ).length;

      // --- COUNT UNEXCUSED ABSENCES FOR DEDUCTION ---
      let unexcusedAbsences = 0;
      for (const assignment of assignments) {
        const session = assignment.attendanceSessions[0];
        // Absence without excuse (not present, not late, not excused)
        if (!session || session.status === AttendanceStatus.ABSENT) {
          unexcusedAbsences++;
        }
      }

      // --- CALCULATE ADJUSTMENTS ---
      const bonusAmount = substitutionCount * this.BONUS_PER_SUBSTITUTION;
      const deductionAmount = unexcusedAbsences * this.DEDUCTION_PER_ABSENCE;
      const netAdjustment = bonusAmount - deductionAmount;

      // --- EVALUATION PER CRITERIA ---
      const attendanceStatus =
        totalScheduledShifts > 0 &&
        validAttendances + unexcusedAbsences >= totalScheduledShifts
          ? unexcusedAbsences === 0
            ? 'Memenuhi'
            : 'Belum Memenuhi' // If there were unexcused absences, it's not fully met
          : 'Belum Memenuhi'; // If not all scheduled shifts were accounted for (even as absent)

      let patrolStatus = 'Belum Memenuhi';
      if (
        validAttendances > 0 &&
        shiftsMeetingPatrolStandards === validAttendances
      ) {
        patrolStatus = 'Memenuhi';
      } else if (totalScheduledShifts === 0) {
        patrolStatus = 'Tidak Ada Penilaian';
      }

      let serviceStatus = 'Tidak Ada Penilaian';
      if (reportsHandledWithRating > 0) {
        serviceStatus = avgRating >= 4 ? 'Memenuhi' : 'Belum Memenuhi';
      }

      // --- FINAL CATEGORY DETERMINATION ---
      let failedCriteriaCount = 0;
      if (attendanceStatus === 'Belum Memenuhi') failedCriteriaCount++;
      if (patrolStatus === 'Belum Memenuhi') failedCriteriaCount++;
      if (serviceStatus === 'Belum Memenuhi') failedCriteriaCount++;

      let finalCategory = 'Baik';
      if (failedCriteriaCount === 1) finalCategory = 'Cukup';
      if (failedCriteriaCount >= 2) finalCategory = 'Kurang';

      evaluations.push({
        linmas_id: linmas.id,
        nama_anggota: linmas.linmasProfile?.fullName || 'Unknown',
        periode: `${year}-${month.toString().padStart(2, '0')}`,
        metrik: {
          presensi: {
            jadwal_shift: totalScheduledShifts,
            presensi_valid: validAttendances,
            unexcused_absences: unexcusedAbsences,
            status: attendanceStatus,
          },
          patroli: {
            jumlah_shift_hadir: validAttendances,
            shift_memenuhi_checkpoint: shiftsMeetingPatrolStandards,
            status: patrolStatus,
          },
          pelayanan: {
            laporan_ditangani: reportsHandledWithRating,
            rata_rata_rating: parseFloat(avgRating.toFixed(2)),
            status: serviceStatus,
          },
        },
        adjustments: {
          substitutions: substitutionCount,
          bonus_amount: bonusAmount,
          unexcused_absences: unexcusedAbsences,
          deduction_amount: deductionAmount,
          net_adjustment: netAdjustment,
        },
        kategori_kinerja: finalCategory,
      });
    }

    return evaluations;
  }

  // ========================
  // DAILY PERFORMANCE (New Logic)
  // ========================
  async getDailyPerformance(
    dateStr: string, // Format: YYYY-MM-DD
    shiftType?: ShiftType,
    specificLinmasId?: string,
  ): Promise<any[]> {
    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) {
      throw new BadRequestException('Invalid date format.');
    }

    const startOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
    );
    const endOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate() + 1,
    );

    const whereClause: Prisma.ShiftAssignmentWhereInput = {
      shift: {
        shiftDate: { gte: startOfDay, lt: endOfDay },
        ...(shiftType ? { shiftType } : {}),
      },
      ...(specificLinmasId ? { linmasId: specificLinmasId } : {}),
    };

    const assignments = await this.prisma.shiftAssignment.findMany({
      where: whereClause,
      include: {
        shift: { include: { regu: true } },
        linmas: { include: { user: true, regu: true } },
        originalLinmas: true, // For substitutes
        attendanceSessions: {
          orderBy: { id: 'desc' },
          take: 1,
          include: {
            logs: {
              include: { photoFile: true },
              orderBy: { timestamp: 'asc' },
            }, // Include photoFile for logs
            visits: true,
            patrolReports: { include: { photoFile: true } }, // Include photoFile for reports
          },
        },
      },
      orderBy: [
        { shift: { shiftType: 'asc' } },
        { linmas: { fullName: 'asc' } },
      ],
    });

    const totalCheckpoints = await this.prisma.patrolCheckpoint.count();

    // Prepare photo file IDs for batch fetching of signed URLs
    const photoFileIds: string[] = [];
    assignments.forEach((assignment) => {
      const session = assignment.attendanceSessions[0];
      if (session) {
        session.logs.forEach((log) => {
          if (log.photoFileId) photoFileIds.push(log.photoFileId);
        });
        session.patrolReports.forEach((report) => {
          if (report.photoFileId) photoFileIds.push(report.photoFileId);
        });
      }
    });

    let photoUrlMap = new Map<
      string,
      { private_url: string; expires_in: number }
    >();
    if (photoFileIds.length > 0) {
      try {
        const photoData =
          await this.storageService.getMultiplePrivateFileUrls(photoFileIds);
        photoUrlMap = new Map(
          photoData.map((p) => [
            p.file_id,
            { private_url: p.private_url, expires_in: p.expires_in },
          ]),
        );
      } catch (error) {
        console.error(
          'Error fetching photo URLs for daily performance:',
          error,
        );
        // Proceed without URLs if fetching fails
      }
    }

    return assignments.map((assignment) => {
      const session = assignment.attendanceSessions[0];
      const clockInLog = session?.logs.find(
        (l) => l.logType === LogType.CLOCK_IN,
      );
      const clockOutLog = session?.logs.find(
        (l) => l.logType === LogType.CLOCK_OUT,
      );

      // Determine attendance status for this shift
      let shiftAttendanceStatus:
        'HADIR' | 'TERLAMBAT' | 'TIDAK_HADIR' | 'IZIN' | 'BELUM_ABSEN' =
        'BELUM_ABSEN';
      if (!session) {
        shiftAttendanceStatus = 'TIDAK_HADIR';
      } else if (session.status === AttendanceStatus.EXCUSED) {
        shiftAttendanceStatus = 'IZIN';
      } else if (session.status === AttendanceStatus.LATE) {
        shiftAttendanceStatus = 'TERLAMBAT';
      } else if (session.status === AttendanceStatus.PRESENT) {
        shiftAttendanceStatus = 'HADIR';
      } else if (session.status === AttendanceStatus.ABSENT) {
        shiftAttendanceStatus = 'TIDAK_HADIR';
      }

      // Calculate patrol completion for this shift
      let patrolCompletion = 0;
      let patrolStatus = 'Belum Selesai';
      if (session) {
        const uniqueVisitedCheckpoints = new Set(
          session.visits.map((v) => v.checkpointId),
        ).size;
        patrolCompletion =
          totalCheckpoints > 0
            ? (uniqueVisitedCheckpoints / totalCheckpoints) * 100
            : 0;
        patrolStatus =
          uniqueVisitedCheckpoints >= totalCheckpoints
            ? 'Selesai'
            : 'Belum Selesai';
      }

      // Count patrol reports made during this shift
      const patrolReportsCount = session ? session.patrolReports.length : 0;

      // Attach photo URLs to logs and reports
      const processedLogs =
        session?.logs.map((log) => ({
          ...log,
          photo_url: photoUrlMap.get(log.photoFileId)?.private_url || null,
          url_expires_in_seconds:
            photoUrlMap.get(log.photoFileId)?.expires_in || null,
        })) || [];

      const processedReports =
        session?.patrolReports.map((report) => ({
          ...report,
          photo_url: photoUrlMap.get(report.photoFileId)?.private_url || null,
          url_expires_in_seconds:
            photoUrlMap.get(report.photoFileId)?.expires_in || null,
        })) || [];

      return {
        shift_assignment_id: assignment.id,
        linmas_id: assignment.linmasId,
        full_name: assignment.linmas.fullName,
        regu_name: assignment.linmas.regu?.name || null,
        is_substitute: assignment.isSubstitute,
        original_linmas_name: assignment.originalLinmas?.fullName || null,
        shift_type: assignment.shift.shiftType,
        shift_date: assignment.shift.shiftDate,
        start_time: assignment.shift.startTime,
        end_time: assignment.shift.endTime,
        attendance_status: shiftAttendanceStatus,
        clock_in_time: clockInLog?.timestamp || null,
        clock_out_time: clockOutLog?.timestamp || null,
        patrol_completion_percentage: parseFloat(patrolCompletion.toFixed(2)),
        patrol_status: patrolStatus,
        patrol_reports_count: patrolReportsCount,
        excuse_note: session?.excuseNote || null,
        completed: !!session?.completedAt,
        // Include logs and reports with URLs
        attendance_logs: processedLogs,
        patrol_reports: processedReports,
      };
    });
  }

  // ========================
  // DETAILED SHIFT ASSIGNMENT PERFORMANCE (New)
  // ========================
  async getShiftAssignmentPerformance(shiftAssignmentId: string) {
    const assignment = await this.prisma.shiftAssignment.findUnique({
      where: { id: shiftAssignmentId },
      include: {
        shift: { include: { regu: true } },
        linmas: { include: { user: true, regu: true } },
        originalLinmas: true,
        attendanceSessions: {
          include: {
            logs: {
              include: { photoFile: true },
              orderBy: { timestamp: 'asc' },
            },
            visits: { include: { checkpoint: true } },
            patrolReports: { include: { photoFile: true } },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Shift assignment not found.');
    }

    const session = assignment.attendanceSessions[0];
    if (!session) {
      return {
        shift_assignment_id: assignment.id,
        message: 'No attendance session recorded for this assignment.',
        linmas: {
          linmas_id: assignment.linmasId,
          full_name: assignment.linmas.fullName,
          regu_name: assignment.linmas.regu?.name || null,
        },
        shift: {
          shift_type: assignment.shift.shiftType,
          shift_date: assignment.shift.shiftDate,
          start_time: assignment.shift.startTime,
          end_time: assignment.shift.endTime,
        },
      };
    }

    // Prepare photo file IDs for batch fetching of signed URLs
    const photoFileIds: string[] = [];
    session.logs.forEach((log) => {
      if (log.photoFileId) photoFileIds.push(log.photoFileId);
    });
    session.patrolReports.forEach((report) => {
      if (report.photoFileId) photoFileIds.push(report.photoFileId);
    });

    let photoUrlMap = new Map<
      string,
      { private_url: string; expires_in: number }
    >();
    if (photoFileIds.length > 0) {
      try {
        const photoData =
          await this.storageService.getMultiplePrivateFileUrls(photoFileIds);
        photoUrlMap = new Map(
          photoData.map((p) => [
            p.file_id,
            { private_url: p.private_url, expires_in: p.expires_in },
          ]),
        );
      } catch (error) {
        console.error(
          'Error fetching photo URLs for detailed performance:',
          error,
        );
        // Proceed without URLs if fetching fails
      }
    }

    // Process logs to attach photo URLs
    const processedLogs = session.logs.map((log) => ({
      ...log,
      photo_url: photoUrlMap.get(log.photoFileId)?.private_url || null,
      url_expires_in_seconds:
        photoUrlMap.get(log.photoFileId)?.expires_in || null,
    }));

    // Process patrol reports to attach photo URLs
    const processedReports = session.patrolReports.map((report) => ({
      ...report,
      photo_url: photoUrlMap.get(report.photoFileId)?.private_url || null,
      url_expires_in_seconds:
        photoUrlMap.get(report.photoFileId)?.expires_in || null,
    }));

    // Calculate patrol summary
    const totalCheckpoints = await this.prisma.patrolCheckpoint.count();
    const uniqueVisitedCheckpoints = new Set(
      session.visits.map((v) => v.checkpointId),
    ).size;
    const patrolCompletionPercentage =
      totalCheckpoints > 0
        ? parseFloat(
            ((uniqueVisitedCheckpoints / totalCheckpoints) * 100).toFixed(2),
          )
        : 0;

    return {
      shift_assignment_id: assignment.id,
      attendance_session_id: session.id,
      linmas: {
        linmas_id: assignment.linmasId,
        full_name: assignment.linmas.fullName,
        regu_name: assignment.linmas.regu?.name || null,
        is_substitute: assignment.isSubstitute,
        original_linmas_name: assignment.originalLinmas?.fullName || null,
      },
      shift: {
        shift_type: assignment.shift.shiftType,
        shift_date: assignment.shift.shiftDate,
        start_time: assignment.shift.startTime,
        end_time: assignment.shift.endTime,
        regu_name: assignment.shift.regu?.name || null,
      },
      attendance: {
        status: session.status,
        excuse_note: session.excuseNote,
        completed_at: session.completedAt,
        logs: processedLogs,
      },
      patrol: {
        completion_percentage: patrolCompletionPercentage,
        total_checkpoints: totalCheckpoints,
        visited_checkpoints: uniqueVisitedCheckpoints,
        visits: session.visits.map((v) => ({
          checkpoint_name: v.checkpoint.name,
          entered_at: v.enteredAt,
          latitude: v.latitude,
          longitude: v.longitude,
        })),
      },
      patrol_reports: processedReports.map((pr) => ({
        id: pr.id,
        patrol_type: pr.patrolType,
        description: pr.description,
        location: {
          latitude: parseFloat(pr.latitude.toString()),
          longitude: parseFloat(pr.longitude.toString()),
        },
        reported_at: pr.reportedAt,
        photo_url: pr.photo_url,
        url_expires_in_seconds: pr.url_expires_in_seconds,
      })),
    };
  }

  // ========================
  // SALARY ADJUSTMENT CREATION (New)
  // ========================
  /**
   * Creates or updates a salary adjustment record for a specific Linmas member
   * for a given month/year, aggregating bonuses and deductions from performance.
   * This method is intended to be called after monthly performance calculations.
   */
  async createOrUpdateMonthlyAdjustment(
    linmasId: string,
    month: number,
    year: number,
    calculatedBonuses: number,
    calculatedDeductions: number,
  ) {
    const netAdjustment = calculatedBonuses - calculatedDeductions;

    // Find or create the adjustment period record
    let adjustmentPeriod = await this.prisma.salaryAdjustmentPeriod.findUnique({
      where: {
        linmasId_month_year: {
          // Ensure unique constraint exists in schema
          linmasId: linmasId,
          month: month,
          year: year,
        },
      },
    });

    if (adjustmentPeriod) {
      // Update existing record
      adjustmentPeriod = await this.prisma.salaryAdjustmentPeriod.update({
        where: { id: adjustmentPeriod.id },
        data: {
          totalBonuses: calculatedBonuses,
          totalDeductions: calculatedDeductions,
          netAdjustment: netAdjustment,
          // Reset approval status if values changed significantly or if previously approved
          isApproved: false,
          approvedAt: null,
        },
      });
    } else {
      // Create new record
      adjustmentPeriod = await this.prisma.salaryAdjustmentPeriod.create({
        data: {
          linmasId: linmasId,
          month: month,
          year: year,
          totalBonuses: calculatedBonuses,
          totalDeductions: calculatedDeductions,
          netAdjustment: netAdjustment,
          isApproved: false,
        },
      });
    }

    return adjustmentPeriod;
  }

  /**
   * Gets the monthly adjustment record for a specific Linmas member.
   */
  async getMonthlyAdjustment(linmasId: string, month: number, year: number) {
    return this.prisma.salaryAdjustmentPeriod.findUnique({
      where: {
        linmasId_month_year: {
          linmasId: linmasId,
          month: month,
          year: year,
        },
      },
      include: {
        linmas: { include: { user: true } },
        approver: true,
        items: true, // Include adjustment items if needed for detail
      },
    });
  }

  /**
   * Approves a specific monthly adjustment record.
   */
  async approveMonthlyAdjustment(
    adjustmentPeriodId: string,
    koordinatorId: string,
  ) {
    const adjustment = await this.prisma.salaryAdjustmentPeriod.findUnique({
      where: { id: adjustmentPeriodId },
      include: { linmas: true },
    });

    if (!adjustment) {
      throw new NotFoundException('Adjustment period record not found.');
    }

    if (adjustment.isApproved) {
      throw new BadRequestException(
        'Adjustment period record is already approved.',
      );
    }

    const now = new Date();
    return this.prisma.salaryAdjustmentPeriod.update({
      where: { id: adjustmentPeriodId },
      data: {
        isApproved: true,
        approvedAt: now,
        approvedByKoorId: koordinatorId,
      },
    });
  }

  async getSpecificMonthlyEvaluation(
    linmasId: string,
    month: number,
    year: number,
  ): Promise<any> {
    // 'any' can be replaced with the specific evaluation object type if defined
    // Reuse the logic from getMonthlyEvaluation, but ensure it always filters by linmasId
    const evaluations = await this.getMonthlyEvaluation(month, year, linmasId);

    // Return the first (and should be only) evaluation from the filtered list
    return evaluations.length > 0 ? evaluations[0] : null;
  }
}
