import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { SubstituteShiftDto } from './dto/substitute-shift.dto';
import { BulkCreateShiftDto } from './dto/bulk-create-shift.dto';
import { ScheduleGeneratorService } from './schedule-generator.service';
import { ShiftType } from '@prisma/client';

@Injectable()
export class ShiftsService {
  constructor(
    private prisma: PrismaService,
    private scheduleGenerator: ScheduleGeneratorService,
  ) {}

  private parseDateTime(dateStr: string, timeStr: string): Date {
    return new Date(`${dateStr}T${timeStr}Z`);
  }

  // --- createShift(), createBulkShifts(), updateShift(), deleteShift() TETAP SAMA SEPERTI SEBELUMNYA ---

  async createShift(dto: CreateShiftDto) {
    /* Logika tidak berubah */
    const shiftDate = new Date(dto.shift_date);
    const startTime = this.parseDateTime(dto.shift_date, dto.start_time);
    const endTime = this.parseDateTime(dto.shift_date, dto.end_time);
    if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);

    return this.prisma.$transaction(async (prisma) => {
      let linmasToAssign = dto.assigned_linmas_ids || [];
      if (dto.regu_id) {
        const regu = await prisma.regu.findUnique({
          where: { id: dto.regu_id },
          include: { linmasMembers: true },
        });
        if (regu) {
          const reguMemberIds = regu.linmasMembers.map((m) => m.userId);
          linmasToAssign = [...new Set([...linmasToAssign, ...reguMemberIds])];
        }
      }

      const shift = await prisma.shift.create({
        data: {
          shiftDate: shiftDate,
          shiftType: dto.shift_type,
          startTime: startTime,
          endTime: endTime,
          reguId: dto.regu_id,
        },
      });

      const assignments = linmasToAssign.map((id) => ({
        shiftId: shift.id,
        linmasId: id,
      }));
      if (assignments.length > 0)
        await prisma.shiftAssignment.createMany({ data: assignments });
      return { shift_id: shift.id };
    });
  }

  async createBulkShifts(dto: BulkCreateShiftDto) {
    /* Logika tidak berubah */
    return this.prisma.$transaction(async (prisma) => {
      const createdShifts: string[] = [];
      for (const shiftData of dto.shifts) {
        const shiftDate = new Date(shiftData.shift_date);
        const startTime = this.parseDateTime(
          shiftData.shift_date,
          shiftData.start_time,
        );
        const endTime = this.parseDateTime(
          shiftData.shift_date,
          shiftData.end_time,
        );
        if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);

        let linmasToAssign = shiftData.assigned_linmas_ids || [];
        if (shiftData.regu_id) {
          const regu = await prisma.regu.findUnique({
            where: { id: shiftData.regu_id },
            include: { linmasMembers: true },
          });
          if (regu) {
            const reguMemberIds = regu.linmasMembers.map((m) => m.userId);
            linmasToAssign = [
              ...new Set([...linmasToAssign, ...reguMemberIds]),
            ];
          }
        }

        const shift = await prisma.shift.create({
          data: {
            shiftDate: shiftDate,
            shiftType: shiftData.shift_type,
            startTime: startTime,
            endTime: endTime,
            reguId: shiftData.regu_id,
          },
        });

        const assignments = linmasToAssign.map((id) => ({
          shiftId: shift.id,
          linmasId: id,
        }));
        if (assignments.length > 0)
          await prisma.shiftAssignment.createMany({ data: assignments });
        createdShifts.push(shift.id);
      }
      return { total_created: createdShifts.length, shift_ids: createdShifts };
    });
  }

  async updateShift(shiftId: string, dto: UpdateShiftDto) {
    /* Logika tidak berubah */
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
    });
    if (!shift) throw new NotFoundException('Shift not found');

    await this.prisma.$transaction(async (prisma) => {
      await prisma.shift.update({
        where: { id: shiftId },
        data: {
          shiftType: dto.shift_type !== undefined ? dto.shift_type : undefined,
          reguId: dto.regu_id !== undefined ? dto.regu_id : undefined,
        },
      });

      if (dto.regu_id !== undefined || dto.assigned_linmas_ids !== undefined) {
        await prisma.shiftAssignment.deleteMany({
          where: { shiftId: shiftId },
        });
        let linmasToAssign = dto.assigned_linmas_ids || [];
        const targetReguId =
          dto.regu_id !== undefined ? dto.regu_id : shift.reguId;

        if (targetReguId) {
          const regu = await prisma.regu.findUnique({
            where: { id: targetReguId },
            include: { linmasMembers: true },
          });
          if (regu) {
            const reguMemberIds = regu.linmasMembers.map((m) => m.userId);
            linmasToAssign = [
              ...new Set([...linmasToAssign, ...reguMemberIds]),
            ];
          }
        }
        if (linmasToAssign.length > 0) {
          const newAssignments = linmasToAssign.map((id) => ({
            shiftId: shiftId,
            linmasId: id,
          }));
          await prisma.shiftAssignment.createMany({ data: newAssignments });
        }
      }
    });
    return true;
  }

  async deleteShift(shiftId: string) {
    /* Logika tidak berubah */
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
    });
    if (!shift) throw new NotFoundException('Shift not found');
    await this.prisma.shift.delete({ where: { id: shiftId } });
    return true;
  }

  // =========================================================================
  // KOORDINATOR: Dapatkan seluruh data jadwal (Tidak Berubah)
  // =========================================================================
  async getShifts(month: number, year: number) {
    if (!month || !year)
      throw new BadRequestException('Month and year are required');

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const shifts = await this.prisma.shift.findMany({
      where: { shiftDate: { gte: startDate, lt: endDate } },
      include: {
        regu: true,
        assignments: { include: { linmas: true, attendanceSessions: true } },
      },
      orderBy: { shiftDate: 'asc' },
    });

    return shifts.map((shift) => ({
      shift_id: shift.id,
      regu_id: shift.reguId,
      regu_name: shift.regu?.name || null,
      shift_date: shift.shiftDate.toISOString().split('T')[0],
      shift_type: shift.shiftType,
      assigned_officers: shift.assignments.map((assignment) => ({
        id: assignment.id,
        linmas_id: assignment.linmas.userId,
        full_name: assignment.linmas.fullName,
        is_substitute: assignment.isSubstitute,
        attendance: assignment.attendanceSessions.map((attendance) => {
          id: attendance.id;
          status: attendance.status;
        }),
      })),
    }));
  }

  // =========================================================================
  // LINMAS: Dapatkan HANYA jadwal milik pribadi (ENDPOINT BARU)
  // =========================================================================
  async getMyShifts(linmasId: string, month: number, year: number) {
    if (!month || !year)
      throw new BadRequestException('Month and year are required');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const assignments = await this.prisma.shiftAssignment.findMany({
      where: {
        linmasId: linmasId,
        shift: { shiftDate: { gte: startDate, lt: endDate } },
      },
      include: {
        shift: { include: { regu: true } },
      },
      orderBy: { shift: { shiftDate: 'asc' } },
    });

    return assignments.map((assignment) => {
      const shift = assignment.shift;
      return {
        shift_id: shift.id,
        shift_date: shift.shiftDate.toISOString().split('T')[0],
        shift_type: shift.shiftType,
        start_time: shift.startTime.toISOString().substring(11, 16), // Format HH:MM
        end_time: shift.endTime.toISOString().substring(11, 16), // Format HH:MM
        regu_name: shift.regu?.name || null,
        is_substitute: assignment.isSubstitute,
      };
    });
  }

  // =========================================================================
  // KOORDINATOR: Pergantian Petugas Shift dengan Validasi Baru
  // =========================================================================
  async assignSubstitute(shiftId: string, dto: SubstituteShiftDto) {
    // 1. Validasi: Pengganti tidak boleh sama dengan petugas asli
    if (dto.original_linmas_id === dto.substitute_linmas_id) {
      throw new BadRequestException(
        'Petugas pengganti tidak boleh orang yang sama.',
      );
    }

    // 2. Validasi: Pastikan tugas asli ada
    const originalAssignment = await this.prisma.shiftAssignment.findFirst({
      where: { shiftId: shiftId, linmasId: dto.original_linmas_id },
    });

    if (!originalAssignment) {
      throw new NotFoundException(
        'Jadwal asli petugas tersebut tidak ditemukan.',
      );
    }

    // 3. Validasi: Pastikan pengganti belum bertugas di shift yang sama
    const existingSubstitute = await this.prisma.shiftAssignment.findFirst({
      where: { shiftId: shiftId, linmasId: dto.substitute_linmas_id },
    });

    if (existingSubstitute) {
      throw new ConflictException(
        'Petugas pengganti sudah ditugaskan pada shift ini.',
      );
    }

    // 4. Lakukan update
    await this.prisma.shiftAssignment.update({
      where: { id: originalAssignment.id },
      data: {
        linmasId: dto.substitute_linmas_id,
        isSubstitute: true,
        originalLinmasId: dto.original_linmas_id,
      },
    });

    // Return struktur JSON yang lebih lengkap
    return {
      shift_id: shiftId,
      original_linmas_id: dto.original_linmas_id,
      substitute_linmas_id: dto.substitute_linmas_id,
      bonus_amount: 50000, // Hardcode/Business Rule
    };
  }

  // =========================================================================
  // KOORDINATOR: PREVIEW GENERATE JADWAL BULANAN
  // =========================================================================
  async previewGenerateMonthlySchedule(month: number, year: number) {
    if (!month || !year) {
      throw new BadRequestException('Month and year are required.');
    }

    // Ambil 4 regu
    const regus = await this.prisma.regu.findMany({
      where: {
        name: {
          in: ['Regu 1', 'Regu 2', 'Regu 3', 'Regu 4'],
        },
      },
      include: {
        linmasMembers: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    if (regus.length !== 4) {
      throw new BadRequestException(
        'Exactly 4 regu are required to generate the schedule.',
      );
    }

    // Pastikan setiap regu memiliki 3 anggota
    for (const regu of regus) {
      if (regu.linmasMembers.length !== 3) {
        throw new BadRequestException(
          `${regu.name} harus memiliki tepat 3 anggota Linmas.`,
        );
      }
    }

    // Cek apakah jadwal pada bulan tersebut sudah ada
    const startDate = new Date(Date.UTC(year, month - 1, 1));

    const endDate = new Date(Date.UTC(year, month, 1));

    const existingShiftCount = await this.prisma.shift.count({
      where: {
        shiftDate: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    if (existingShiftCount > 0) {
      throw new ConflictException(
        `Jadwal bulan ${month}/${year} sudah tersedia.`,
      );
    }

    // Generate jadwal
    const generated = this.scheduleGenerator.generate(
      year,
      month,
      regus.map((regu) => ({
        id: regu.id,
        name: regu.name,
      })),
    );

    // Tambahkan informasi anggota agar Android
    // tidak perlu request lagi hanya untuk preview
    const result = generated.map((shift) => {
      const regu = regus.find((r) => r.id === shift.regu_id);

      return {
        shift_date: shift.shift_date,
        shift_type: shift.shift_type,
        start_time: shift.start_time,
        end_time: shift.end_time,

        regu: {
          id: regu?.id,
          name: regu?.name,
          members:
            regu?.linmasMembers.map((member) => ({
              linmas_id: member.userId,
              full_name: member.fullName,
            })) ?? [],
        },
      };
    });

    return {
      month,
      year,
      total_days: new Date(year, month, 0).getDate(),
      total_shifts: result.length,
      regu_count: regus.length,
      valid: true,
      shifts: result,
    };
  }

  // =========================================================================
  // KOORDINATOR: GENERATE & SIMPAN JADWAL BULANAN
  // =========================================================================
  async generateMonthlySchedule(month: number, year: number) {
    if (!month || !year) {
      throw new BadRequestException('Month and year are required.');
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1));

    const endDate = new Date(Date.UTC(year, month, 1));

    return this.prisma.$transaction(async (prisma) => {
      // =====================================================
      // 1. Cegah duplicate schedule
      // =====================================================
      const existingShift = await prisma.shift.findFirst({
        where: {
          shiftDate: {
            gte: startDate,
            lt: endDate,
          },
        },
      });

      if (existingShift) {
        throw new ConflictException(
          `Jadwal bulan ${month}/${year} sudah tersedia.`,
        );
      }

      // =====================================================
      // 2. Ambil regu
      // =====================================================
      const regus = await prisma.regu.findMany({
        where: {
          name: {
            in: ['Regu 1', 'Regu 2', 'Regu 3', 'Regu 4'],
          },
        },
        include: {
          linmasMembers: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      if (regus.length !== 4) {
        throw new BadRequestException('Exactly 4 regu are required.');
      }

      // =====================================================
      // 3. Validasi anggota tiap regu
      // =====================================================
      for (const regu of regus) {
        if (regu.linmasMembers.length !== 3) {
          throw new BadRequestException(
            `${regu.name} harus memiliki tepat 3 anggota.`,
          );
        }
      }

      // =====================================================
      // 4. Generate schedule
      // =====================================================
      const generated = this.scheduleGenerator.generate(
        year,
        month,
        regus.map((regu) => ({
          id: regu.id,
          name: regu.name,
        })),
      );

      // =====================================================
      // 5. Insert shifts + assignments
      // =====================================================
      const createdShifts: string[] = [];

      for (const shiftData of generated) {
        const shiftDate = new Date(`${shiftData.shift_date}T00:00:00.000Z`);

        const startTime = new Date(
          `${shiftData.shift_date}T${shiftData.start_time}.000Z`,
        );

        const endDateValue =
          shiftData.shift_type === ShiftType.NIGHT
            ? new Date(
                new Date(`${shiftData.shift_date}T00:00:00.000Z`).getTime() +
                  24 * 60 * 60 * 1000,
              )
            : new Date(`${shiftData.shift_date}T00:00:00.000Z`);

        const endDateString = endDateValue.toISOString().split('T')[0];

        const endTime = new Date(`${endDateString}T${shiftData.end_time}.000Z`);

        // Ambil regu
        const regu = regus.find((r) => r.id === shiftData.regu_id);

        if (!regu) {
          throw new BadRequestException('Regu untuk shift tidak ditemukan.');
        }

        // -------------------------
        // Create Shift
        // -------------------------
        const shift = await prisma.shift.create({
          data: {
            shiftDate,
            shiftType: shiftData.shift_type,
            startTime,
            endTime,
            reguId: regu.id,
          },
        });

        // -------------------------
        // Create assignments
        // -------------------------
        const assignments = regu.linmasMembers.map((member) => ({
          shiftId: shift.id,
          linmasId: member.userId,
          isSubstitute: false,
        }));

        await prisma.shiftAssignment.createMany({
          data: assignments,
        });

        createdShifts.push(shift.id);
      }

      return {
        success: true,
        month,
        year,
        total_created: createdShifts.length,
        shift_ids: createdShifts,
      };
    });
  }
}
