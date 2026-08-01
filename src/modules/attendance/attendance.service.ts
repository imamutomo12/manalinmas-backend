import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { StorageService } from '../storage/storage.service'; // Import StorageService
import { calculateHaversineDistance } from '../../common/utils/geo.util';
import { AttendanceStatus, LogType, GeofenceStatus } from '@prisma/client';

@Injectable()
export class AttendanceService {
  private readonly GEOFENCE_LAT = -6.904810338149059;
  private readonly GEOFENCE_LNG = 107.61031378245713;
  private readonly GEOFENCE_RADIUS_METERS = 50.0;

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
}
