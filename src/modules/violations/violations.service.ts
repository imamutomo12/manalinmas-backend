import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateViolationDto } from './dto/create-violation.dto';

@Injectable()
export class ViolationsService {
  constructor(private prisma: PrismaService) {}

  async createViolation(koordinatorId: string, dto: CreateViolationDto) {
    const linmas = await this.prisma.user.findUnique({
      where: { id: dto.linmas_id },
    });

    if (!linmas) throw new NotFoundException('Linmas officer not found');

    const violation = await this.prisma.violation.create({
      data: {
        linmasId: dto.linmas_id,
        issuedByKoorId: koordinatorId,
        violationType: dto.violation_type,
        sanctionLevel: dto.sanction_level,
        incidentDate: new Date(dto.incident_date),
      },
    });

    return { violation_id: violation.id };
  }

  async getViolations(linmasId?: string) {
    const violations = await this.prisma.violation.findMany({
      where: linmasId ? { linmasId } : undefined,
      include: {
        linmas: true,
        koordinator: true,
      },
      orderBy: { incidentDate: 'desc' },
    });

    return violations.map((v) => ({
      violation_id: v.id,
      linmas_name: v.linmas.fullName,
      issued_by: v.koordinator.fullName,
      violation_type: v.violationType,
      sanction_level: v.sanctionLevel,
      incident_date: v.incidentDate.toISOString().split('T')[0],
    }));
  }
}
