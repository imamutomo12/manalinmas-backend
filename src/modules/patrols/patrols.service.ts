import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { VisitCheckpointDto } from './dto/visit-checkpoint.dto';
import { CreatePatrolReportDto } from './dto/create-patrol-report.dto';
import { calculateHaversineDistance } from '../../common/utils/geo.util';

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

    // 2. Cek apakah sudah pernah dikunjungi di sesi shift ini
    const existingVisit = await this.prisma.patrolVisit.findUnique({
      where: {
        attendanceSessionId_checkpointId: {
          attendanceSessionId: session.id,
          checkpointId: checkpoint.id,
        },
      },
    });

    if (existingVisit) {
      throw new BadRequestException(
        'Checkpoint ini sudah dikunjungi pada shift Anda saat ini.',
      );
    }

    // 3. Validasi Geofencing (SERVER SIDE)
    const distance = calculateHaversineDistance(
      parseFloat(checkpoint.latitude.toString()),
      parseFloat(checkpoint.longitude.toString()),
      dto.latitude,
      dto.longitude,
    );

    if (distance > checkpoint.radiusMeters) {
      throw new BadRequestException(
        `Geofence gagal. Anda berjarak ${Math.round(distance)} meter dari ${checkpoint.name}. Maksimal radius adalah ${checkpoint.radiusMeters} meter.`,
      );
    }

    // 4. Catat Kunjungan
    const visit = await this.prisma.patrolVisit.create({
      data: {
        attendanceSessionId: session.id,
        checkpointId: checkpoint.id,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });

    return {
      visit_id: visit.id,
      verified_distance: parseFloat(distance.toFixed(2)),
      entered_at: visit.enteredAt.toISOString(),
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
    const visitedCheckpoints = await this.prisma.patrolVisit.count({
      where: { attendanceSessionId: session.id },
    });

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
    // 1. Upload file terlebih dahulu via StorageService
    const uploadedPhoto = await this.storageService.uploadFile(
      linmasId,
      photoFile,
      'patrol-reports',
    );

    // 2. Simpan Laporan
    const patrol = await this.prisma.patrolReport.create({
      data: {
        linmasId: linmasId,
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

  async getPatrolReports() {
    const patrols = await this.prisma.patrolReport.findMany({
      orderBy: { reportedAt: 'desc' },
      include: {
        linmas: { include: { regu: true } },
        // Relasi photoFile tidak perlu di-include lagi karena tidak dipakai di list
      },
    });

    return patrols.map((p) => ({
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
    }));
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
