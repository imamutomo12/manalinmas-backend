import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PatrolType, Prisma, ShiftType } from '@prisma/client';
import { StorageService } from '../storage/storage.service';
import { VisitCheckpointDto } from './dto/visit-checkpoint.dto';
import { CreatePatrolReportDto } from './dto/create-patrol-report.dto';
import { calculateHaversineDistance } from '../../common/utils/geo.util';

export interface PatrolReportFilters {
  patrolType?: PatrolType;
  reguId?: string;
  linmasId?: string;
  date?: string; // single day, YYYY-MM-DD
  dateFrom?: string;
  dateTo?: string;
  shiftType?: ShiftType; // MORNING | NIGHT
  shiftAssignmentId?: string; // presisi: satu occurrence shift tertentu
  page?: number;
  limit?: number;
}

@Injectable()
export class PatrolsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService, // Inject Storage untuk upload foto
  ) {}

  // ===========================================================================
  // HELPER: MENCARI SESI ABSENSI AKTIF (CLOCK-IN)
  // ===========================================================================
  private async getActiveSession(linmasId: string) {
    const session = await this.prisma.attendanceSession.findFirst({
      where: {
        linmasProfileUserId: linmasId,
        completedAt: null, // Artinya belum clock-out
      },
      orderBy: { id: 'desc' },
    });

    if (!session) {
      throw new BadRequestException(
        'Anda tidak memiliki sesi shift yang aktif. Silakan Clock-In terlebih dahulu.',
      );
    }
    return session;
  }

  // ===========================================================================
  // A. PATROLI RUTIN (CHECKPOINT)
  // ===========================================================================

  async getCheckpoints() {
    const checkpoints = await this.prisma.patrolCheckpoint.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return checkpoints.map((cp) => ({
      checkpoint_id: cp.id,
      name: cp.name,
      description: cp.description,
      latitude: parseFloat(cp.latitude.toString()),
      longitude: parseFloat(cp.longitude.toString()),
      radius: cp.radiusMeters,
      block: cp.block,
      rt: cp.rt,
    }));
  }

  async visitCheckpoint(linmasId: string, dto: VisitCheckpointDto) {
    const session = await this.getActiveSession(linmasId);

    // 1. Cari checkpoint
    const checkpoint = await this.prisma.patrolCheckpoint.findUnique({
      where: { id: dto.checkpoint_id },
    });

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint tidak ditemukan.');
    }

    // 2. Validasi Geofencing (SERVER SIDE) - berlaku untuk kunjungan
    // pertama maupun kunjungan ulang
    const distance = calculateHaversineDistance(
      parseFloat(checkpoint.latitude.toString()),
      parseFloat(checkpoint.longitude.toString()),
      dto.latitude,
      dto.longitude,
    );

    // 3. Catat Kunjungan. Setiap kunjungan dicatat sebagai baris baru — jadi
    // checkpoint yang sama boleh dikunjungi berkali-kali dalam satu shift,
    // dan setiap kunjungan punya waktunya (enteredAt) masing-masing.
    const visit = await this.prisma.patrolVisit.create({
      data: {
        attendanceSessionId: session.id,
        checkpointId: checkpoint.id,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });

    // 4. Hitung sudah berapa kali checkpoint ini dikunjungi pada shift ini
    const visitCount = await this.prisma.patrolVisit.count({
      where: { attendanceSessionId: session.id, checkpointId: checkpoint.id },
    });

    return {
      visit_id: visit.id,
      verified_distance: parseFloat(distance.toFixed(2)),
      entered_at: visit.enteredAt.toISOString(),
      visit_count: visitCount,
    };
  }

  async getVisitHistory(linmasId: string) {
    const session = await this.getActiveSession(linmasId);

    const visits = await this.prisma.patrolVisit.findMany({
      where: { attendanceSessionId: session.id },
      include: { checkpoint: true },
      orderBy: { enteredAt: 'desc' },
    });

    return visits.map((v) => ({
      visit_id: v.id,
      checkpoint_id: v.checkpoint.id,
      checkpoint_name: v.checkpoint.name,
      entered_at: v.enteredAt.toISOString(),
    }));
  }

  async getPatrolSummary(linmasId: string) {
    const session = await this.getActiveSession(linmasId);

    const totalCheckpoints = await this.prisma.patrolCheckpoint.count();

    // groupBy checkpointId, bukan count() biasa, karena satu checkpoint bisa
    // punya beberapa baris PatrolVisit (kunjungan berulang) dalam satu shift -
    // count() polos akan menghitung ganda dan bikin percentage lewat 100%.
    const visitedGroups = await this.prisma.patrolVisit.groupBy({
      by: ['checkpointId'],
      where: { attendanceSessionId: session.id },
    });
    const visitedCheckpoints = visitedGroups.length;

    const percentage =
      totalCheckpoints > 0 ? (visitedCheckpoints / totalCheckpoints) * 100 : 0;

    return {
      visited: visitedCheckpoints,
      total: totalCheckpoints,
      percentage: parseFloat(percentage.toFixed(2)),
    };
  }

  // ===========================================================================
  // B. LAPORAN TEMUAN (REPORT)
  // ===========================================================================

  async createPatrolReport(
    linmasId: string,
    dto: CreatePatrolReportDto,
    photoFile: Express.Multer.File,
  ) {
    // 0. FAIL FAST: Wajib punya sesi shift aktif sebelum upload foto
    // (konsisten dengan visitCheckpoint/getVisitHistory/getPatrolSummary)
    const session = await this.getActiveSession(linmasId);

    // 1. Upload file terlebih dahulu via StorageService
    const uploadedPhoto = await this.storageService.uploadFile(
      linmasId,
      photoFile,
      'patrol-reports',
    );

    // 2. Simpan Laporan (terikat ke sesi shift yang sedang aktif)
    const patrol = await this.prisma.patrolReport.create({
      data: {
        linmasId: linmasId,
        attendanceSessionId: session.id,
        patrolType: dto.patrol_type,
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        photoFileId: uploadedPhoto.file_id, // Gunakan ID dari hasil upload
      },
    });

    return {
      patrol_id: patrol.id,
      photo_url: uploadedPhoto.cdn_url,
    };
  }

  async getPatrolReports(filters: PatrolReportFilters = {}) {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit =
      filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20;

    const conditions: Prisma.PatrolReportWhereInput[] = [];

    if (filters.patrolType) conditions.push({ patrolType: filters.patrolType });
    if (filters.linmasId) conditions.push({ linmasId: filters.linmasId });
    if (filters.reguId) conditions.push({ linmas: { reguId: filters.reguId } });

    if (filters.shiftAssignmentId) {
      // Presisi: laporan dari SATU occurrence shift tertentu.
      conditions.push({
        attendanceSession: { shiftAssignmentId: filters.shiftAssignmentId },
      });
    } else if (filters.shiftType) {
      // Laporan dari shift bertipe tertentu, pada tanggal tertentu (default hari ini).
      const targetDate = filters.date ? new Date(filters.date) : new Date();
      const shiftDate = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
      );
      conditions.push({
        attendanceSession: {
          shiftAssignment: {
            shift: { shiftDate, shiftType: filters.shiftType },
          },
        },
      });
    } else if (filters.date) {
      // Filter umum: laporan yang dibuat pada tanggal kalender tertentu.
      const d = new Date(filters.date);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      conditions.push({
        reportedAt: { gte: dayStart, lt: this.addDays(dayStart, 1) },
      });
    } else if (filters.dateFrom || filters.dateTo) {
      conditions.push({
        reportedAt: {
          ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
          ...(filters.dateTo
            ? { lt: this.addDays(new Date(filters.dateTo), 1) }
            : {}),
        },
      });
    }

    const where: Prisma.PatrolReportWhereInput = conditions.length
      ? { AND: conditions }
      : {};

    const [patrols, total] = await this.prisma.$transaction([
      this.prisma.patrolReport.findMany({
        where,
        orderBy: { reportedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          linmas: { include: { regu: true } },
          // Relasi photoFile tidak perlu di-include lagi karena tidak dipakai di list
        },
      }),
      this.prisma.patrolReport.count({ where }),
    ]);

    return {
      items: patrols.map((p) => ({
        patrol_id: p.id,
        reporter: {
          linmas_id: p.linmas.userId,
          full_name: p.linmas.fullName,
          regu_name: p.linmas.regu?.name || null,
        },
        patrol_type: p.patrolType,
        description: p.description,
        location: {
          latitude: parseFloat(p.latitude.toString()),
          longitude: parseFloat(p.longitude.toString()),
        },
        // photo_url DIHILANGKAN UNTUK MENGHEMAT BANDWIDTH DAN MEMPERCEPAT API LIST
        reported_at: p.reportedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  private addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  async getPatrolReportDetail(patrolId: string) {
    const patrol = await this.prisma.patrolReport.findUnique({
      where: { id: patrolId },
      include: {
        linmas: { include: { regu: true } },
      },
    });

    if (!patrol) throw new NotFoundException('Patrol report not found');

    // MINTA PRIVATE URL (SIGNED URL) DARI STORAGE SERVICE
    // URL ini biasanya hanya valid selama 1 jam sesuai settingan Backblaze Anda
    const photoData = await this.storageService.getPrivateFileUrl(
      patrol.photoFileId,
    );

    return {
      patrol_id: patrol.id,
      reporter: {
        linmas_id: patrol.linmas.userId,
        full_name: patrol.linmas.fullName,
        regu_name: patrol.linmas.regu?.name || null,
      },
      patrol_type: patrol.patrolType,
      description: patrol.description,
      location: {
        latitude: parseFloat(patrol.latitude.toString()),
        longitude: parseFloat(patrol.longitude.toString()),
      },
      // Kembalikan Private URL dari Storage Service beserta masa berlakunya
      photo_url: photoData.private_url,
      url_expires_in_seconds: photoData.expires_in,
      reported_at: patrol.reportedAt.toISOString(),
    };
  }
}
