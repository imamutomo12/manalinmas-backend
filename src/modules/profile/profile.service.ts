import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    // 1. Fetch the base user and all possible 1:1 profiles
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        linmasProfile: { include: { regu: true } },
        wargaProfile: true,
        koordinatorProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    // 2. Setup the base response skeleton
    const baseProfile = {
      user_id: user.id,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role,
    };

    // 3. Role-Specific Payload Formatting (FLAT STRUCTURE)

    // --- RESPONSE UNTUK LINMAS ---
    if (user.role === Role.LINMAS && user.linmasProfile) {
      // Fetch the latest violation for the SP status
      const latestViolation = await this.prisma.violation.findFirst({
        where: { linmasId: userId },
        orderBy: { incidentDate: 'desc' },
      });

      return {
        ...baseProfile,
        full_name: user.linmasProfile.fullName,
        address: user.linmasProfile.address,
        employment_date: user.linmasProfile.employmentDate
          .toISOString()
          .split('T')[0],
        regu_name: user.linmasProfile.regu?.name || null,
        current_sanction_level: latestViolation
          ? latestViolation.sanctionLevel
          : null,
      };
    }

    // --- RESPONSE UNTUK WARGA ---
    if (user.role === Role.WARGA && user.wargaProfile) {
      // Count total incidents reported by this Warga
      const totalIncidents = await this.prisma.incident.count({
        where: { reportedByWargaId: userId },
      });

      return {
        ...baseProfile,
        full_name: user.wargaProfile.fullName,
        address: user.wargaProfile.address,
        total_incidents_reported: totalIncidents,
      };
    }

    // --- RESPONSE UNTUK KOORDINATOR ---
    if (user.role === Role.KOORDINATOR && user.koordinatorProfile) {
      return {
        ...baseProfile,
        full_name: user.koordinatorProfile.fullName,
      };
    }

    // Fallback jika terjadi anomali (User ada tapi profil ekstensinya tidak ada)
    throw new NotFoundException('Profile details are incomplete');
  }
}
