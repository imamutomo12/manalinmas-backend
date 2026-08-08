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

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

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
}
