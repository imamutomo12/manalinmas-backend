import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { IncidentStatus, ResponseType, Role } from '@prisma/client';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { InterveneIncidentDto } from './dto/intervene-incident.dto';
import { CreateIncidentRatingDto } from './dto/create-incident-rating.dto';

@Injectable()
export class IncidentsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService, // Inject Storage API
    private notificationsService: NotificationsService,
  ) {}

  async createIncident(
    wargaId: string,
    dto: CreateIncidentDto,
    photoFile: Express.Multer.File,
  ) {
    // 1. Upload photo directly via Storage Service
    const uploadedPhoto = await this.storageService.uploadFile(
      wargaId,
      photoFile,
      'incidents',
    );

    // 2. Simpan insiden ke DB. Title digabungkan dari Type + Judul
    const incident = await this.prisma.incident.create({
      data: {
        reportedByWargaId: wargaId,
        title: `[${dto.incident_type}] ${dto.title}`,
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        photoFileId: uploadedPhoto.file_id,
        status: IncidentStatus.MENUNGGU,
      },
    });

    // 3. Trigger FCM Topic ke seluruh Linmas aktif
    await this.notificationsService.sendToTopic(
      'security_alerts_rw07',
      '🚨 DARURAT: ' + dto.incident_type,
      dto.title,
      { incident_id: incident.id },
    );

    return {
      incident_id: incident.id,
      status: incident.status,
      photo_url: uploadedPhoto.cdn_url, // Warga boleh lihat URL publik sesaat setelah upload
    };
  }

  // --- getIncidents() dan getActiveIncidents() logikanya TETAP SAMA (Return Handler Name) ---
  // List tidak menyertakan photo URL untuk menghemat bandwidth.
  async getIncidents() {
    const incidents = await this.prisma.incident.findMany({
      orderBy: { reportedAt: 'desc' },
      include: {
        responses: {
          include: { responder: { include: { linmasProfile: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return incidents.map((inc) => this.mapIncidentList(inc));
  }

  async getActiveIncidents() {
    const incidents = await this.prisma.incident.findMany({
      where: {
        status: {
          in: [
            IncidentStatus.MENUNGGU,
            IncidentStatus.DITANGANI,
            IncidentStatus.DIALIHKAN,
          ],
        },
      },
      orderBy: { reportedAt: 'desc' },
      include: {
        responses: {
          include: { responder: { include: { linmasProfile: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return incidents.map((inc) => this.mapIncidentList(inc));
  }

  private mapIncidentList(inc: any) {
    const activeHandler =
      inc.responses.length > 0 ? inc.responses[0].responder : null;
    return {
      incident_id: inc.id,
      title: inc.title,
      status: inc.status,
      reported_at: inc.reportedAt.toISOString(),
      handler: activeHandler
        ? {
            linmas_id: activeHandler.id,
            full_name: activeHandler.linmasProfile?.fullName || 'Unknown',
          }
        : null,
    };
  }

  // ==========================================================
  // DETAIL INCIDENT (Full Data + Rating + Private Photo URL)
  // ==========================================================
  async getIncidentDetail(incidentId: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        warga: true,
        rating: true, // Sertakan Rating
        responses: {
          include: { responder: { include: { linmasProfile: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!incident) throw new NotFoundException('Incident not found');

    // Minta Signed URL untuk Foto Bukti
    const photoData = await this.storageService.getPrivateFileUrl(
      incident.photoFileId,
    );
    const activeHandler =
      incident.responses.length > 0 ? incident.responses[0].responder : null;

    return {
      incident_id: incident.id,
      title: incident.title,
      description: incident.description,
      status: incident.status,
      location: {
        latitude: parseFloat(incident.latitude.toString()),
        longitude: parseFloat(incident.longitude.toString()),
      },
      reporter: {
        warga_id: incident.warga.userId,
        full_name: incident.warga.fullName,
        address: incident.warga.address,
      },
      handler: activeHandler
        ? {
            linmas_id: activeHandler.id,
            full_name: activeHandler.linmasProfile?.fullName || 'Unknown',
          }
        : null,
      photo_url: photoData.private_url,
      url_expires_in_seconds: photoData.expires_in,
      reported_at: incident.reportedAt.toISOString(),
      handled_at: incident.handledAt ? incident.handledAt.toISOString() : null,
      resolved_at: incident.resolvedAt
        ? incident.resolvedAt.toISOString()
        : null,
      // Field Rating dari database
      rating: incident.rating
        ? {
            score: incident.rating.rating,
            review: incident.rating.review,
            rated_at: incident.rating.ratedAt.toISOString(),
          }
        : null,
    };
  }

  // ==========================================================
  // LINMAS ACTION: CLAIM
  // ==========================================================
  async claimIncident(incidentId: string, linmasId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const incident = await prisma.incident.findUnique({
        where: { id: incidentId },
      });

      if (!incident) throw new NotFoundException('Incident not found');
      if (incident.status !== IncidentStatus.MENUNGGU) {
        throw new ConflictException(
          'Insiden ini sudah ditangani atau selesai.',
        );
      }

      const now = new Date();

      await prisma.incident.update({
        where: { id: incidentId },
        data: {
          status: IncidentStatus.DITANGANI,
          handledAt: now,
          linmasProfileUserId: linmasId, // Track linmas handler
        },
      });

      const response = await prisma.incidentResponse.create({
        data: {
          incidentId: incidentId,
          responderId: linmasId,
          responseType: ResponseType.CLAIMED,
          createdAt: now,
        },
        include: { responder: { include: { linmasProfile: true } } },
      });

      // (Logic notifikasi ke Linmas lain tidak diubah, bisa pakai token yang ada)

      return {
        incident_id: incidentId,
        status: IncidentStatus.DITANGANI,
        handler_name: response.responder.linmasProfile?.fullName || 'Unknown',
      };
    });
  }

  // ==========================================================
  // LINMAS/: UPDATE STATUS
  // ==========================================================
  async updateIncidentStatus(
    incidentId: string,
    userId: string,
    dto: UpdateIncidentStatusDto,
  ) {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: { responses: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!incident) throw new NotFoundException('Incident not found');

    const updateData: any = { status: dto.status };

    // Jika diselesaikan, simpan siapa yang menyelesaikan dan waktunya
    if (dto.status === IncidentStatus.MENUNGGUPENILAIANWARGA) {
      updateData.resolvedAt = new Date();
      updateData.resolvedById = userId;
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.incident.update({
        where: { id: incidentId },
        data: updateData,
      });

      if (incident.responses.length > 0) {
        await prisma.incidentResponse.update({
          where: { id: incident.responses[0].id },
          data: { notes: dto.resolution_notes },
        });
      }
    });
  }

  // ==========================================================
  // KOORDINATOR ACTION: INTERVENE
  // ==========================================================
  async interveneIncident(incidentId: string, dto: InterveneIncidentDto) {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });
    if (!incident) throw new NotFoundException('Incident not found');

    await this.prisma.$transaction(async (prisma) => {
      await prisma.incident.update({
        where: { id: incidentId },
        data: {
          status: IncidentStatus.DITANGANI,
          linmasProfileUserId: dto.new_handler_linmas_id,
        },
      });

      await prisma.incidentResponse.create({
        data: {
          incidentId: incidentId,
          responderId: dto.new_handler_linmas_id,
          responseType: ResponseType.INTERVENED,
          notes: `[Intervensi Koordinator]: ${dto.intervention_reason}`,
        },
      });
    });
  }

  // ==========================================================
  // WARGA ACTION: GET MY INCIDENTS
  // ==========================================================
  async getMyIncidents(wargaId: string) {
    const incidents = await this.prisma.incident.findMany({
      where: { reportedByWargaId: wargaId },
      orderBy: { reportedAt: 'desc' },
      include: {
        rating: true,
        responses: {
          include: { responder: { include: { linmasProfile: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return incidents.map((inc) => {
      const activeHandler =
        inc.responses.length > 0 ? inc.responses[0].responder : null;
      return {
        incident_id: inc.id,
        title: inc.title,
        status: inc.status,
        reported_at: inc.reportedAt.toISOString(),
        handler: activeHandler?.linmasProfile?.fullName || null,
        rating: inc.rating ? inc.rating.rating : null, // Warga bisa tahu mana yang belum di-rating (null)
      };
    });
  }

  // ==========================================================
  // WARGA ACTION: CREATE RATING (NEW ENDPOINT)
  // ==========================================================
  async createIncidentRating(
    incidentId: string,
    wargaId: string,
    dto: CreateIncidentRatingDto,
  ) {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: { rating: true },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    // Validasi Kepemilikan Laporan
    if (incident.reportedByWargaId !== wargaId) {
      throw new ForbiddenException(
        'Anda tidak berhak memberi rating pada laporan ini.',
      );
    }

    // Validasi Status Laporan (Harus sudah selesai)
    if (incident.status !== IncidentStatus.MENUNGGUPENILAIANWARGA) {
      throw new BadRequestException(
        'Laporan belum selesai, rating tidak dapat diberikan.',
      );
    }

    // Validasi Apakah Sudah Pernah Diberi Rating
    if (incident.rating) {
      throw new ConflictException('Laporan ini sudah diberikan rating.');
    }

    await this.prisma.incident.update({
      where: { id: incidentId },
      data: {
        status: IncidentStatus.SELESAI,
      },
    });

    // Insert ke tabel IncidentRating
    const rating = await this.prisma.incidentRating.create({
      data: {
        incidentId: incidentId,
        rating: dto.rating,
        review: dto.review || null,
      },
    });

    return {
      rating_id: rating.id,
      score: rating.rating,
    };
  }
}
