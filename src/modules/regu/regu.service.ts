import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReguDto } from './dto/create-regu.dto';
import { UpdateReguDto } from './dto/update-regu.dto';
// Menghapus: import { connect } from 'http2'; (Sesuai instruksi)

@Injectable()
export class ReguService {
  constructor(private prisma: PrismaService) {}

  async createRegu(dto: CreateReguDto) {
    // 1. Cek apakah nama Regu sudah ada
    const existing = await this.prisma.regu.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Regu name already exists');
    }

    // 2. Validasi Anggota Linmas (Cegah "Penculikan Anggota")
    if (dto.linmas_ids && dto.linmas_ids.length > 0) {
      const alreadyAssignedLinmas = await this.prisma.linmasProfile.findMany({
        where: {
          userId: { in: dto.linmas_ids },
          reguId: { not: null }, // Mencari Linmas yang sudah punya Regu
        },
      });

      if (alreadyAssignedLinmas.length > 0) {
        const names = alreadyAssignedLinmas.map((l) => l.fullName).join(', ');
        throw new BadRequestException(
          `Anggota berikut sudah tergabung dalam Regu lain: ${names}. Silakan keluarkan dari regu sebelumnya terlebih dahulu.`,
        );
      }
    }

    // 3. Buat Regu baru
    const regu = await this.prisma.regu.create({
      data: {
        name: dto.name,
        description: dto.description,
        linmasMembers:
          dto.linmas_ids && dto.linmas_ids.length > 0
            ? {
                connect: dto.linmas_ids.map((id) => ({ userId: id })),
              }
            : undefined,
      },
    });

    return { regu_id: regu.id };
  }

  async getRegus() {
    const regus = await this.prisma.regu.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { linmasMembers: true },
        },
      },
    });

    return regus.map((r) => ({
      regu_id: r.id,
      name: r.name,
      description: r.description,
      total_members: r._count.linmasMembers,
      created_at: r.created_at.toISOString(),
    }));
  }

  async getReguById(id: string) {
    const regu = await this.prisma.regu.findUnique({
      where: { id },
      include: {
        linmasMembers: {
          include: { user: true },
        },
      },
    });

    if (!regu) throw new NotFoundException('Regu not found');

    return {
      regu_id: regu.id,
      name: regu.name,
      description: regu.description,
      members: regu.linmasMembers.map((m) => ({
        linmas_id: m.userId,
        full_name: m.fullName,
        phone_number: m.user.phone_number,
      })),
    };
  }

  async updateRegu(id: string, dto: UpdateReguDto) {
    const regu = await this.prisma.regu.findUnique({ where: { id } });
    if (!regu) throw new NotFoundException('Regu not found');

    if (dto.name && dto.name !== regu.name) {
      const existing = await this.prisma.regu.findUnique({
        where: { name: dto.name },
      });
      if (existing) throw new ConflictException('Regu name already exists');
    }

    // Catatan: Pada proses update, logika `set` di Prisma diizinkan karena memang
    // fungsinya adalah untuk mengubah total komposisi anggota secara sengaja/sadar.
    await this.prisma.regu.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        linmasMembers:
          dto.linmas_ids !== undefined
            ? {
                set: dto.linmas_ids.map((id) => ({ userId: id })),
              }
            : undefined,
      },
    });

    return true;
  }

  async deleteRegu(id: string) {
    const regu = await this.prisma.regu.findUnique({
      where: { id },
      include: {
        _count: {
          select: { linmasMembers: true, shifts: true },
        },
      },
    });

    if (!regu) throw new NotFoundException('Regu not found');

    // Architectural Safety Check
    if (regu._count.linmasMembers > 0 || regu._count.shifts > 0) {
      throw new ConflictException(
        `Cannot delete Regu. It is currently linked to ${regu._count.linmasMembers} personnel and ${regu._count.shifts} shifts.`,
      );
    }

    await this.prisma.regu.delete({ where: { id } });
    return true;
  }
}
