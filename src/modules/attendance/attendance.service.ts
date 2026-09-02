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
  private readonly GEOFENCE_LAT = -6.968220595803268;
  private readonly GEOFENCE_LNG = 107.58146283779371;
  private readonly GEOFENCE_RADIUS_METERS = 100.0;
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

    /**
     * Karena shiftDate di database adalah PostgreSQL DATE,
     * kita gunakan tanggal lokal Asia/Jakarta sebagai dasar.
     */
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Untuk query shiftDate (@db.Date), gunakan batas UTC
    const yesterdayStart = new Date(
      Date.UTC(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(),
      ),
    );

    const tomorrowStart = new Date(
      Date.UTC(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()),
    );

    console.log('========== ATTENDANCE DEBUG ==========');
    console.log('linmasId:', linmasId);
    console.log('now:', now.toString());
    console.log('now ISO:', now.toISOString());

    console.log('todayStart:', today.toISOString());

    console.log('yesterdayStart:', yesterdayStart.toISOString());

    console.log('tomorrowStart:', tomorrowStart.toISOString());

    /**
     * Ambil assignment untuk:
     * - shift yang mulai hari ini
     * - shift yang mulai kemarin
     *
     * Shift kemarin diperlukan untuk NIGHT shift
     * yang masih berlangsung setelah tengah malam.
     */
    const assignments = await this.prisma.shiftAssignment.findMany({
      where: {
        linmasId,

        shift: {
          shiftDate: {
            gte: yesterdayStart,
            lt: tomorrowStart,
          },
        },
      },

      include: {
        shift: true,

        attendanceSessions: {
          orderBy: {
            id: 'desc',
          },
          take: 1,
        },
      },

      orderBy: {
        shift: {
          shiftDate: 'desc',
        },
      },
    });

    console.log('FOUND ASSIGNMENTS:', JSON.stringify(assignments, null, 2));

    if (assignments.length === 0) {
      return {
        status: 'NO_SHIFT_TODAY',
        message: 'Anda tidak memiliki jadwal hari ini.',
      };
    }

    /**
     * Cari assignment yang waktunya masih relevan
     * dengan waktu sekarang.
     */
    let selectedAssignment: (typeof assignments)[number] | null = null;

    let selectedShiftStart: Date | null = null;
    let selectedShiftEnd: Date | null = null;

    let selectedEarliestClockIn: Date | null = null;
    let selectedLatestClockOut: Date | null = null;

    for (const assignment of assignments) {
      const shift = assignment.shift;

      /**
       * shift.startTime dan shift.endTime berasal dari PostgreSQL TIME.
       * Prisma merepresentasikannya sebagai Date dengan tanggal dummy.
       *
       * Kita ambil jam dan menitnya saja.
       */
      const startHours = shift.startTime.getUTCHours();
      const startMinutes = shift.startTime.getUTCMinutes();

      const endHours = shift.endTime.getUTCHours();
      const endMinutes = shift.endTime.getUTCMinutes();
      /**
       * Tentukan tanggal mulai berdasarkan shiftDate.
       *
       * shiftDate dari PostgreSQL DATE direpresentasikan Prisma
       * sebagai Date.
       */
      const shiftDate = new Date(shift.shiftDate);

      const shiftYear = shiftDate.getUTCFullYear();
      const shiftMonth = shiftDate.getUTCMonth();
      const shiftDay = shiftDate.getUTCDate();

      /**
       * Buat start datetime berdasarkan tanggal shift + jam start.
       */
      const shiftStartTime = new Date(
        shiftYear,
        shiftMonth,
        shiftDay,
        startHours,
        startMinutes,
        0,
        0,
      );

      /**
       * Buat end datetime berdasarkan tanggal shift + jam end.
       */
      const shiftEndTime = new Date(
        shiftYear,
        shiftMonth,
        shiftDay,
        endHours,
        endMinutes,
        0,
        0,
      );

      /**
       * Jika end < start, berarti shift melewati tengah malam.
       *
       * Contoh:
       * 22:00 → 06:00
       *
       * Maka end menjadi tanggal berikutnya.
       */
      if (shiftEndTime <= shiftStartTime) {
        shiftEndTime.setDate(shiftEndTime.getDate() + 1);
      }

      /**
       * Clock-in dibuka 30 menit sebelum shift.
       */
      const earliestClockIn = new Date(
        shiftStartTime.getTime() - 30 * 60 * 1000,
      );

      /**
       * Clock-out masih ditoleransi 4 jam setelah shift selesai.
       */
      const latestClockOut = new Date(
        shiftEndTime.getTime() + 4 * 60 * 60 * 1000,
      );

      console.log('----------------------------');
      console.log('Assignment:', assignment.id);
      console.log('Shift date:', shift.shiftDate);
      console.log('Shift type:', shift.shiftType);
      console.log('Shift start:', shiftStartTime.toString());
      console.log('Shift end:', shiftEndTime.toString());
      console.log('Earliest clock in:', earliestClockIn.toString());
      console.log('Latest clock out:', latestClockOut.toString());
      console.log('Now:', now.toString());

      /**
       * Tentukan apakah shift masih relevan.
       *
       * Relevan jika:
       *
       * now >= earliestClockIn
       * dan
       * now <= latestClockOut
       *
       * Ini menangani:
       *
       * Shift biasa:
       * 07:00 - 19:00
       *
       * Shift malam:
       * 22:00 - 06:00
       */
      const isRelevant = now >= earliestClockIn && now <= latestClockOut;

      if (isRelevant) {
        selectedAssignment = assignment;
        selectedShiftStart = shiftStartTime;
        selectedShiftEnd = shiftEndTime;
        selectedEarliestClockIn = earliestClockIn;
        selectedLatestClockOut = latestClockOut;

        /**
         * Karena assignments diurutkan dari shiftDate
         * terbaru, assignment pertama yang relevan
         * adalah kandidat utama.
         */
        break;
      }
    }

    /**
     * Tidak ada shift yang sedang aktif / mendekati waktunya.
     */
    if (
      !selectedAssignment ||
      !selectedShiftStart ||
      !selectedShiftEnd ||
      !selectedEarliestClockIn ||
      !selectedLatestClockOut
    ) {
      return {
        status: 'NO_SHIFT_TODAY',
        message: 'Tidak ada jadwal yang sedang aktif.',
      };
    }

    const session = selectedAssignment.attendanceSessions[0];

    /**
     * Belum melakukan clock-in.
     */
    if (!session) {
      /**
       * Belum masuk periode clock-in.
       */
      if (now < selectedEarliestClockIn) {
        const hh = selectedEarliestClockIn
          .getHours()
          .toString()
          .padStart(2, '0');

        const mm = selectedEarliestClockIn
          .getMinutes()
          .toString()
          .padStart(2, '0');

        return {
          status: 'WAITING',
          message: `Absen masuk dibuka pukul ${hh}:${mm}`,
        };
      }

      /**
       * Sudah melewati waktu shift.
       */
      if (now > selectedShiftEnd) {
        return {
          status: 'MISSED',
          message: 'Waktu shift sudah berakhir.',
        };
      }

      /**
       * Saatnya melakukan clock-in.
       */
      return {
        status: 'CAN_CLOCK_IN',
        shift_assignment_id: selectedAssignment.id,
      };
    }

    /**
     * Sudah clock-out.
     */
    if (session.completedAt) {
      return {
        status: 'COMPLETED',
        message: 'Tugas hari ini selesai. Terima kasih.',
      };
    }

    /**
     * Sudah melewati batas clock-out.
     */
    if (now > selectedLatestClockOut) {
      return {
        status: 'FORFEIT',
        message: 'Lupa absen pulang (Sistem ditutup).',
      };
    }

    /**
     * Sudah clock-in tetapi belum clock-out.
     */
    return {
      status: 'CAN_CLOCK_OUT',
      attendance_session_id: session.id,
    };
  }
  async getTodayAttendanceData(dateStr?: string, shiftType?: ShiftType) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
    );
    const endOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate() + 1,
    );

    const assignments = await this.prisma.shiftAssignment.findMany({
      where: {
        shift: {
          shiftDate: { gte: startOfDay, lt: endOfDay },
          ...(shiftType ? { shiftType } : {}),
        },
      },
      include: {
        shift: { include: { regu: true } },
        linmas: { include: { user: true, regu: true } },
        originalLinmas: true,
        attendanceSessions: {
          orderBy: { id: 'desc' },
          take: 1,
          include: { logs: true },
        },
      },
      orderBy: [{ shift: { shiftType: 'asc' } }],
    });

    return assignments.map((assignment) => {
      const session = assignment.attendanceSessions[0];
      const clockIn = session?.logs.find((l) => l.logType === LogType.CLOCK_IN);
      const clockOut = session?.logs.find(
        (l) => l.logType === LogType.CLOCK_OUT,
      );

      return {
        shift_assignment_id: assignment.id,
        attendance_session_id: session?.id ?? null,
        linmas_id: assignment.linmasId,
        full_name: assignment.linmas.fullName,
        phone_number: assignment.linmas.user?.phone_number ?? null,
        regu_name: assignment.linmas.regu?.name ?? null,
        is_substitute: assignment.isSubstitute,
        original_linmas_name: assignment.originalLinmas?.fullName ?? null,
        shift_type: assignment.shift.shiftType,
        shift_date: assignment.shift.shiftDate,
        start_time: assignment.shift.startTime,
        end_time: assignment.shift.endTime,
        // Belum ada session = anggota belum absen & belum divonis ABSENT oleh cron
        status: session?.status ?? 'BELUM_ABSEN',
        clock_in_time: clockIn?.timestamp ?? null,
        clock_out_time: clockOut?.timestamp ?? null,
        excuse_note: session?.excuseNote ?? null,
      };
    });
  }

  async getAttendanceDetail(sessionId: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        shiftAssignment: {
          include: { shift: { include: { regu: true } } },
        },
        linmasProfile: { include: { user: true, regu: true } },
        logs: { include: { photoFile: true }, orderBy: { timestamp: 'asc' } },
        visits: { include: { checkpoint: true } },
      },
    });

    if (!session) {
      throw new NotFoundException('Sesi presensi tidak ditemukan.');
    }

    // Ambil signed URL untuk semua foto pada sesi ini sekaligus (1 auth token B2)
    const photoFileIds = session.logs.map((log) => log.photoFileId);
    const photoUrls = photoFileIds.length
      ? await this.storageService.getMultiplePrivateFileUrls(photoFileIds)
      : [];
    const urlMap = new Map(photoUrls.map((p) => [p.file_id, p]));

    const mapLog = (type: LogType) => {
      const log = session.logs.find((l) => l.logType === type);
      if (!log) return null;

      const signedUrl = urlMap.get(log.photoFileId);

      return {
        log_id: log.id,
        timestamp: log.timestamp,
        latitude: log.latitude,
        longitude: log.longitude,
        distance_meters: log.distanceMeters,
        geofence_status: log.geofenceStatus,
        geofence_radius: log.geofenceRadius,
        photo: {
          file_id: log.photoFileId,
          original_name: log.photoFile.original_name,
          mime_type: log.photoFile.mime_type,
          url: signedUrl?.private_url ?? null,
          expires_in: signedUrl?.expires_in ?? null,
        },
      };
    };

    return {
      attendance_session_id: session.id,
      status: session.status,
      excuse_note: session.excuseNote,
      completed_at: session.completedAt,
      linmas: {
        linmas_id: session.linmasProfileUserId,
        full_name: session.linmasProfile?.fullName,
        address: session.linmasProfile?.address,
        phone_number: session.linmasProfile?.user?.phone_number,
        regu_name: session.linmasProfile?.regu?.name ?? null,
      },
      shift: {
        shift_id: session.shiftAssignment.shift.id,
        shift_type: session.shiftAssignment.shift.shiftType,
        shift_date: session.shiftAssignment.shift.shiftDate,
        start_time: session.shiftAssignment.shift.startTime,
        end_time: session.shiftAssignment.shift.endTime,
        regu_name: session.shiftAssignment.shift.regu?.name ?? null,
        is_substitute: session.shiftAssignment.isSubstitute,
      },
      clock_in: mapLog(LogType.CLOCK_IN),
      clock_out: mapLog(LogType.CLOCK_OUT),
      patrol_visits: session.visits.map((v) => ({
        checkpoint_name: v.checkpoint.name,
        entered_at: v.enteredAt,
      })),
    };
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
