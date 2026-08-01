import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateLinmasDto } from './dto/create-linmas.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUsers(role?: Role) {
    const users = await this.prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        is_active: true, // hanya tampilkan yang aktif
      },
      select: {
        id: true,
        role: true,
        email: true,
        phone_number: true,
        linmasProfile: { include: { regu: true } },
        wargaProfile: true,
        koordinatorProfile: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return users.map((user) => {
      let reguName = '';
      let fullName = '';
      if (user.role === Role.LINMAS) {
        fullName = user.linmasProfile?.fullName ?? '';
        reguName = user.linmasProfile?.regu?.name ?? '';
      } else if (user.role === Role.WARGA) {
        fullName = user.wargaProfile?.fullName ?? '';
      } else if (user.role === Role.KOORDINATOR) {
        fullName = user.koordinatorProfile?.fullName ?? '';
      }
      return {
        user_id: user.id,
        role: user.role,
        full_name: fullName,
        email: user.email,
        phone_number: user.phone_number,
        regu_name: reguName,
      };
    });
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        linmasProfile: { include: { regu: true } },
        wargaProfile: true,
        koordinatorProfile: true,
      },
    });

    if (!user || !user.is_active) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const base = {
      user_id: user.id,
      role: user.role,
      email: user.email,
      phone_number: user.phone_number,
      full_name: '',
      address: '',
      regu_name: '',
      employment_date: null as Date | null,
      appointment_date: null as Date | null,
    };

    if (user.role === Role.LINMAS && user.linmasProfile) {
      base.full_name = user.linmasProfile.fullName;
      base.address = user.linmasProfile.address;
      base.regu_name = user.linmasProfile.regu?.name ?? '';
      base.employment_date = user.linmasProfile.employmentDate;
    } else if (user.role === Role.WARGA && user.wargaProfile) {
      base.full_name = user.wargaProfile.fullName;
      base.address = user.wargaProfile.address;
    } else if (user.role === Role.KOORDINATOR && user.koordinatorProfile) {
      base.full_name = user.koordinatorProfile.fullName;
      base.appointment_date = user.koordinatorProfile.appointmentDate;
    }

    return base;
  }

  async createLinmas(dto: CreateLinmasDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone_number: dto.phone_number }],
      },
    });
    if (existing) {
      throw new BadRequestException('Email atau nomor HP sudah digunakan');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const employmentDate = dto.employment_date
      ? new Date(dto.employment_date)
      : new Date();

    const user = await this.prisma.user.create({
      data: {
        role: Role.LINMAS,
        email: dto.email,
        phone_number: dto.phone_number,
        password_hash: hashedPassword,
        linmasProfile: {
          create: {
            fullName: dto.fullName,
            address: dto.address,
            employmentDate,
            reguId: dto.regu_id ?? null,
          },
        },
      },
      include: {
        linmasProfile: { include: { regu: true } },
      },
    });

    return {
      user_id: user.id,
      role: user.role,
      full_name: user.linmasProfile?.fullName ?? '',
      email: user.email,
      phone_number: user.phone_number,
      regu_name: user.linmasProfile?.regu?.name ?? '',
    };
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        linmasProfile: true,
        wargaProfile: true,
        koordinatorProfile: true,
      },
    });

    if (!user || !user.is_active) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Update data User (email & phone)
    const userUpdateData: any = {};
    if (dto.email) userUpdateData.email = dto.email;
    if (dto.phone_number) userUpdateData.phone_number = dto.phone_number;

    // Update profile sesuai role
    const profileUpdate = {};

    if (user.role === Role.LINMAS && user.linmasProfile) {
      if (dto.full_name) profileUpdate['fullName'] = dto.full_name;
      if (dto.address) profileUpdate['address'] = dto.address;
      if (dto.regu_id !== undefined) profileUpdate['reguId'] = dto.regu_id;
    } else if (user.role === Role.WARGA && user.wargaProfile) {
      if (dto.full_name) profileUpdate['fullName'] = dto.full_name;
      if (dto.address) profileUpdate['address'] = dto.address;
    } else if (user.role === Role.KOORDINATOR && user.koordinatorProfile) {
      if (dto.full_name) profileUpdate['fullName'] = dto.full_name;
    }

    // Gunakan transaksi agar konsisten
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id },
          data: userUpdateData,
        });
      }

      if (Object.keys(profileUpdate).length > 0) {
        if (user.role === Role.LINMAS) {
          await tx.linmasProfile.update({
            where: { userId: id },
            data: profileUpdate as any,
          });
        } else if (user.role === Role.WARGA) {
          await tx.wargaProfile.update({
            where: { userId: id },
            data: profileUpdate as any,
          });
        } else if (user.role === Role.KOORDINATOR) {
          await tx.koordinatorProfile.update({
            where: { userId: id },
            data: profileUpdate as any,
          });
        }
      }

      return tx.user.findUnique({
        where: { id },
        include: {
          linmasProfile: { include: { regu: true } },
          wargaProfile: true,
          koordinatorProfile: true,
        },
      });
    });

    // Mapping respons seperti detail
    return this.getUserById(updatedUser!.id);
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || !user.is_active) {
      throw new NotFoundException(
        'User tidak ditemukan atau sudah dinonaktifkan',
      );
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        is_active: false,
        deleted_at: new Date(),
      },
    });

    return { success: true, message: 'User berhasil dinonaktifkan' };
  }
}
