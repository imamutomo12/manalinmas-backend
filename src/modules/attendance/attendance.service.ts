import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { StorageService } from '../storage/storage.service'; // Import StorageService
import { calculateHaversineDistance } from '../../common/utils/geo.util';
import {
  AttendanceStatus,
  LogType,
  GeofenceStatus,
  ShiftType,
} from '@prisma/client';
import { HandlePermissionDto } from './dto/permission.dto';

@Injectable()
export class AttendanceService {
  private readonly GEOFENCE_LAT = -6.904810338149059;
  private readonly GEOFENCE_LNG = 107.61031378245713;
  private readonly GEOFENCE_RADIUS_METERS = 50.0;
  private readonly logger = new Logger(AttendanceService.name);
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  getGeofenceConfig() {
    return {
      geofence_id: 'GEO_RW07_SUKAMENAK',
      latitude: this.GEOFENCE_LAT,
      longitude: this.GEOFENCE_LNG,
      radius_meters: this.GEOFENCE_RADIUS_METERS,
    };
  }

  async clockIn(
    linmasId: string,
    dto: ClockInDto,
    photoFile: Express.Multer.File,
  ) {
    // 0. Cegah Double Clock-In
    const existingSession = await this.prisma.attendanceSession.findFirst({
      where: {
        shiftAssignmentId: dto.shift_assignment_id,
        linmasProfileUserId: linmasId,
      },
    });

    if (existingSession) {
      throw new BadRequestException(
        'Anda sudah melakukan Clock-In untuk shift ini.',
      );
    }

    // 1. FAIL FAST: Cek Geofence Dulu SEBELUM Upload File
    const distance = calculateHaversineDistance(
      this.GEOFENCE_LAT,
      this.GEOFENCE_LNG,
      dto.latitude,
      dto.longitude,
    );

    const geofenceStatus =
      distance <= this.GEOFENCE_RADIUS_METERS
        ? GeofenceStatus.VERIFIED_INSIDE
        : GeofenceStatus.VERIFIED_OUTSIDE;

    if (geofenceStatus === GeofenceStatus.VERIFIED_OUTSIDE) {
      throw new BadRequestException(
        `Geofence gagal. Anda berada ${Math.round(distance)} meter dari pos. Silakan mendekat.`,
      );
    }

    // 2. Fetch assignment
    const assignment = await this.prisma.shiftAssignment.findUnique({
      where: { id: dto.shift_assignment_id },
      include: { shift: true },
    });

    if (!assignment || assignment.linmasId !== linmasId) {
      throw new NotFoundException('Jadwal shift tidak valid.');
    }

    // 3. Upload File ke B2 Storage (Baru dilakukan jika geofence sukses)
    const uploadedPhoto = await this.storageService.uploadFile(
      linmasId,
      photoFile,
      'attendance-logs', // Nama folder di bucket
    );

    // 4. Hitung Keterlambatan
    const now = new Date();
    const shiftStart = new Date(assignment.shift.startTime);
    shiftStart.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

    const diffMins = (now.getTime() - shiftStart.getTime()) / 60000;
    const status =
      diffMins > 15 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

    // 5. Simpan Session & Log
    const session = await this.prisma.attendanceSession.create({
      data: {
        linmasProfileUserId: linmasId,
        shiftAssignmentId: assignment.id,
        status: status,
        logs: {
          create: {
            logType: LogType.CLOCK_IN,
            latitude: dto.latitude,
            longitude: dto.longitude,
            geofenceStatus: geofenceStatus,
            distanceMeters: distance,
            geofenceRadius: this.GEOFENCE_RADIUS_METERS,
            photoFileId: uploadedPhoto.file_id, // ID dari hasil upload
          },
        },
      },
    });

    return {
      attendance_session_id: session.id,
      attendance_status: status,
      verified_distance_meters: parseFloat(distance.toFixed(2)),
      photo_url: uploadedPhoto.cdn_url,
    };
  }

  async clockOut(
    linmasId: string,
    dto: ClockOutDto,
    photoFile: Express.Multer.File,
  ) {
    const session = await this.prisma.attendanceSession.findFirst({
      where: {
        id: dto.attendance_session_id,
        linmasProfileUserId: linmasId,
      },
    });

    if (!session) throw new NotFoundException('Sesi presensi tidak ditemukan.');

    // 0. Cegah Double Clock-Out
    const existingClockOut = await this.prisma.attendanceLog.findFirst({
      where: {
        sessionId: session.id,
        logType: LogType.CLOCK_OUT,
      },
    });

    if (existingClockOut) {
      throw new BadRequestException(
        'Anda sudah melakukan Clock-Out untuk shift ini.',
      );
    }

    const now = new Date();

    // 1. FAIL FAST: Cek Geofence
    const distance = calculateHaversineDistance(
      this.GEOFENCE_LAT,
      this.GEOFENCE_LNG,
      dto.latitude,
      dto.longitude,
    );

    const geofenceStatus =
      distance <= this.GEOFENCE_RADIUS_METERS
        ? GeofenceStatus.VERIFIED_INSIDE
        : GeofenceStatus.VERIFIED_OUTSIDE;

    // 2. Upload foto absen pulang
    const uploadedPhoto = await this.storageService.uploadFile(
      linmasId,
      photoFile,
      'attendance-logs',
    );

    // 3. Transaksi DB: Log Clock Out & Update Session menjadi Selesai
    await this.prisma.$transaction([
      this.prisma.attendanceLog.create({
        data: {
          sessionId: session.id,
          logType: LogType.CLOCK_OUT,
          latitude: dto.latitude,
          longitude: dto.longitude,
          geofenceStatus: geofenceStatus,
          distanceMeters: distance,
          geofenceRadius: this.GEOFENCE_RADIUS_METERS,
          photoFileId: uploadedPhoto.file_id,
          timestamp: now,
        },
      }),
      this.prisma.attendanceSession.update({
        where: { id: session.id },
        data: {
          completedAt: now,
        },
      }),
    ]);

    return {
      attendance_session_id: session.id,
      verified_distance_meters: parseFloat(distance.toFixed(2)),
      clock_out_time: now.toISOString(),
      photo_url: uploadedPhoto.cdn_url,
    };
  }

  async getRecap(month: number, year: number) {
    const sessions = await this.prisma.attendanceSession.findMany({
      where: {
        shiftAssignment: {
          shift: {
            shiftDate: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1),
            },
          },
        },
      },
      include: {
        linmasProfile: { include: { regu: true } },
      },
    });

    const recapMap = new Map();

    for (const session of sessions) {
      const lId = session.linmasProfileUserId;
      if (!lId) continue;

      if (!recapMap.has(lId)) {
        recapMap.set(lId, {
          linmas_id: lId,
          full_name: session.linmasProfile?.fullName,
          regu_name: session.linmasProfile?.regu?.name || null,
          present_count: 0,
          absent_count: 0,
          late_count: 0,
        });
      }

      const stats = recapMap.get(lId);
      if (session.status === AttendanceStatus.PRESENT) stats.present_count += 1;
      if (session.status === AttendanceStatus.LATE) stats.late_count += 1;
      if (session.status === AttendanceStatus.ABSENT) stats.absent_count += 1;
    }

    return Array.from(recapMap.values());
  }

  async getTodayAttendanceStatus(linmasId: string) {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    const assignment = await this.prisma.shiftAssignment.findFirst({
      where: {
        linmasId: linmasId,
        shift: { shiftDate: { gte: startOfDay, lt: endOfDay } },
      },
      include: {
        shift: true,
        // Gunakan findFirst dan orderBy agar aman
        attendanceSessions: {
          orderBy: { id: 'desc' },
          take: 1,
        },
      },
    });

    if (!assignment) {
      return {
        status: 'NO_SHIFT_TODAY',
        message: 'Anda tidak memiliki jadwal hari ini.',
      };
    }

    const shift = assignment.shift;
    const session = assignment.attendanceSessions[0];

    const shiftStartTime = new Date(shift.startTime);
    shiftStartTime.setFullYear(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const shiftEndTime = new Date(shift.endTime);
    shiftEndTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

    if (shiftEndTime < shiftStartTime)
      shiftEndTime.setDate(shiftEndTime.getDate() + 1);

    const earliestClockIn = new Date(shiftStartTime.getTime() - 30 * 60000);
    const latestClockOut = new Date(shiftEndTime.getTime() + 4 * 60 * 60000);

    if (!session) {
      if (now < earliestClockIn) {
        const hh = earliestClockIn.getHours().toString().padStart(2, '0');
        const mm = earliestClockIn.getMinutes().toString().padStart(2, '0');
        return {
          status: 'WAITING',
          message: `Absen masuk dibuka pukul ${hh}:${mm}`,
        };
      }
      if (now > shiftEndTime) {
        console.log('Now:', now);
        console.log('Shift Start:', shiftStartTime);
        console.log('Shift End:', shiftEndTime);
        return { status: 'MISSED', message: 'Waktu shift sudah berakhir.' };
      }
      return { status: 'CAN_CLOCK_IN', shift_assignment_id: assignment.id };
    }

    // Jika ada session dan sudah tercatat "ended_at" (dari Clock-Out baru)
    if (session.completedAt) {
      return {
        status: 'COMPLETED',
        message: 'Tugas hari ini selesai. Terima kasih.',
      };
    }

    if (now > latestClockOut) {
      return {
        status: 'FORFEIT',
        message: 'Lupa absen pulang (Sistem ditutup).',
      };
    }

    return { status: 'CAN_CLOCK_OUT', attendance_session_id: session.id };
  }

  async handleCoordinatorPermission(
    koordinatorId: string,
    dto: HandlePermissionDto,
  ) {
    // 1. Validasi jadwal shift
    const assignment = await this.prisma.shiftAssignment.findUnique({
      where: { id: dto.shift_assignment_id },
      include: { shift: true, linmas: true },
    });

    if (!assignment) {
      throw new NotFoundException('Jadwal shift tidak ditemukan.');
    }

    const note = dto.reason;

    // 2. Cek apakah sudah ada AttendanceSession untuk shift ini
    const existingSession = await this.prisma.attendanceSession.findFirst({
      where: { shiftAssignmentId: assignment.id },
    });

    if (existingSession) {
      // ---------------------------------------------------------
      // SKENARIO B: Cron sudah jalan, statusnya sudah ABSENT
      // Lakukan UPDATE (Override)
      // ---------------------------------------------------------
      if (existingSession.status === AttendanceStatus.EXCUSED) {
        throw new BadRequestException(
          'Anggota ini sudah ditandai Izin/Sakit sebelumnya.',
        );
      }

      const updatedSession = await this.prisma.attendanceSession.update({
        where: { id: existingSession.id },
        data: {
          id: existingSession.id,
          status: AttendanceStatus.EXCUSED, // Ubah dari ABSENT ke EXCUSED
          excuseNote: note,
          completedAt: new Date(),
        },
      });

      const updatedAttendanceStatus = {
        id: assignment.id,
        note: note,
      };

      return {
        message: `Status ${assignment.linmas.fullName} berhasil diubah dari ABSENT menjadi EXCUSED.`,
        data: updatedAttendanceStatus,
      };
    } else {
      // ---------------------------------------------------------
      // SKENARIO A: Cron belum jalan, belum ada data presensi
      // Lakukan INSERT (Buat data EXCUSED baru)
      // ---------------------------------------------------------
      const newExcusedSession = await this.prisma.attendanceSession.create({
        data: {
          shiftAssignmentId: assignment.id,
          linmasProfileUserId: assignment.linmasId,
          status: AttendanceStatus.EXCUSED,
          completedAt: new Date(), // Diisi agar Cron Job mengabaikan data ini nanti
          excuseNote: note,
        },
      });
      const newAttendanceStatus = {
        id: assignment.id,
        note: note,
      };

      return {
        message: `Izin untuk ${assignment.linmas.fullName} berhasil dicatat. Sistem tidak akan memvonis absen.`,
        data: newAttendanceStatus,
      };
    }
  }

  private async processAutomatedAbsence(shiftType: ShiftType) {
    const now = new Date();
    // Ambil tanggal hari ini (tanpa jam)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Cari penugasan shift hari ini yang BELUM memiliki AttendanceSession (belum clock-in)
    const missedAssignments = await this.prisma.shiftAssignment.findMany({
      where: {
        shift: {
          shiftDate: today,
          shiftType: shiftType,
        },
        attendanceSessions: {
          none: {}, // PENTING: Hanya cari yang belum ada session presensinya
        },
      },
      include: {
        linmas: { include: { user: true } }, // Untuk data notifikasi
      },
    });

    if (missedAssignments.length === 0) {
      this.logger.log(
        `[CRON ${shiftType}] Semua anggota shift ${shiftType} hadir.`,
      );
      return;
    }

    // Buat record ABSENT secara massal (Bulk Insert)
    const createPromises = missedAssignments.map((assignment) =>
      this.prisma.attendanceSession.create({
        data: {
          shiftAssignmentId: assignment.id,
          linmasProfileUserId: assignment.linmasId,
          status: AttendanceStatus.ABSENT,
          completedAt: now, // Diisi agar tidak diproses ulang oleh cron rekonsiliasi
        },
      }),
    );

    await this.prisma.$transaction(createPromises);

    // [TAMBAHAN] Kirim Notifikasi ke Koordinator Keamanan di sini
    // await this.notificationService.alertKoordinator(missedAssignments);

    this.logger.warn(
      `[CRON ${shiftType}] ${missedAssignments.length} anggota divonis ABSENT tanpa kabar.`,
    );
  }

  @Cron('30 7 * * *', { timeZone: 'Asia/Jakarta' })
  async handleMorningShiftAbsence() {
    await this.processAutomatedAbsence(ShiftType.MORNING);
  }

  @Cron('30 19 * * *', { timeZone: 'Asia/Jakarta' })
  async handleNightShiftAbsence() {
    await this.processAutomatedAbsence(ShiftType.NIGHT);
  }
}
