import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, IncidentStatus } from '@prisma/client';

@Injectable()
export class PerformanceService {
  constructor(private prisma: PrismaService) {}

  async getMonthlyEvaluation(
    month: number,
    year: number,
    specificLinmasId?: string,
  ) {
    if (!month || !year)
      throw new BadRequestException('Bulan dan Tahun wajib diisi.');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // 1. Ambil target anggota (Bisa 1 spesifik Linmas, atau semua Linmas aktif)
    const linmasList = await this.prisma.user.findMany({
      where: {
        role: Role.LINMAS,
        ...(specificLinmasId ? { id: specificLinmasId } : {}),
      },
      include: { linmasProfile: true },
    });

    // 2. Ambil Master Data Checkpoint untuk pembanding Patroli
    const totalCheckpoints = await this.prisma.patrolCheckpoint.count();

    const evaluations: Record<string, any>[] = [];
    // 3. Lakukan Iterasi Perhitungan untuk Setiap Linmas
    for (const linmas of linmasList) {
      // --- TAHAP PENGUKURAN PRESENSI & PATROLI ---
      const assignments = await this.prisma.shiftAssignment.findMany({
        where: {
          linmasId: linmas.id,
          shift: { shiftDate: { gte: startDate, lt: endDate } },
        },
        include: {
          attendanceSessions: {
            include: { visits: true },
          },
        },
      });

      let totalJadwalShift = assignments.length;
      let presensiValid = 0;
      let patroliMemenuhiShift = 0;

      for (const assign of assignments) {
        // Ambil sesi absensi pertama (karena 1 shift = 1 sesi)
        const session = assign.attendanceSessions[0];

        // Syarat Valid: Ada sesi dan sudah selesai (Clock-Out terekam)
        if (session && session.completedAt) {
          presensiValid++;

          // Cek kelengkapan checkpoint di sesi ini
          // Menggunakan Set untuk menghitung checkpoint unik (mencegah double count)
          const uniqueVisits = new Set(
            session.visits.map((v) => v.checkpointId),
          ).size;

          if (totalCheckpoints > 0 && uniqueVisits >= totalCheckpoints) {
            patroliMemenuhiShift++;
          }
        }
      }

      // --- TAHAP PENGUKURAN PELAYANAN WARGA ---
      const incidents = await this.prisma.incident.findMany({
        where: {
          linmasProfileUserId: linmas.id, // Insiden yang ditangani oleh Linmas ini
          status: IncidentStatus.SELESAI,
          resolvedAt: { gte: startDate, lt: endDate },
        },
        include: { rating: true },
      });

      let laporanDitangani = 0;
      let akumulasiRating = 0;

      for (const inc of incidents) {
        if (inc.rating) {
          laporanDitangani++;
          akumulasiRating += inc.rating.rating;
        }
      }

      let rataRataRating =
        laporanDitangani > 0 ? akumulasiRating / laporanDitangani : 0;

      // =========================================================================
      // TAHAP EVALUASI STANDAR KINERJA (Merujuk pada Tabel 3.6 Skripsi)
      // =========================================================================

      // Evaluasi 1: PRESENSI
      // Memenuhi jika jumlah presensi valid >= jumlah jadwal yang diberikan
      const statusPresensi =
        totalJadwalShift > 0 && presensiValid >= totalJadwalShift
          ? 'Memenuhi'
          : 'Belum Memenuhi';

      // Evaluasi 2: PATROLI
      // Memenuhi jika SEMUA shift yang dihadiri (presensi valid), seluruh checkpoint-nya tercapai
      // Rujukan Tabel 3.11: Amin Hadir 7 Shift, Patroli Memenuhi 5 Shift = Belum Memenuhi
      let statusPatroli = 'Belum Memenuhi';
      if (presensiValid > 0 && patroliMemenuhiShift === presensiValid) {
        statusPatroli = 'Memenuhi';
      } else if (totalJadwalShift === 0) {
        statusPatroli = 'Tidak Ada Penilaian'; // Kasus jika Linmas tidak punya shift sama sekali
      }

      // Evaluasi 3: PELAYANAN
      // Memenuhi jika Rata-rata rating >= 4
      let statusPelayanan = 'Tidak Ada Penilaian';
      if (laporanDitangani > 0) {
        statusPelayanan = rataRataRating >= 4 ? 'Memenuhi' : 'Belum Memenuhi';
      }

      // =========================================================================
      // PENENTUAN KATEGORI AKHIR (Merujuk pada Tabel 3.13 Skripsi)
      // =========================================================================
      let indikatorGagal = 0;
      if (statusPresensi === 'Belum Memenuhi') indikatorGagal++;
      if (statusPatroli === 'Belum Memenuhi') indikatorGagal++;
      if (statusPelayanan === 'Belum Memenuhi') indikatorGagal++;

      let kategoriAkhir = 'Baik';
      if (indikatorGagal === 1) kategoriAkhir = 'Cukup';
      if (indikatorGagal >= 2) kategoriAkhir = 'Kurang';

      // Susun Data Rapor
      evaluations.push({
        linmas_id: linmas.id,
        nama_anggota: linmas.linmasProfile?.fullName || 'Unknown',
        periode: `${year}-${month.toString().padStart(2, '0')}`,
        metrik: {
          presensi: {
            jadwal_shift: totalJadwalShift,
            presensi_valid: presensiValid,
            status: statusPresensi,
          },
          patroli: {
            jumlah_shift_hadir: presensiValid,
            shift_memenuhi_checkpoint: patroliMemenuhiShift,
            status: statusPatroli,
          },
          pelayanan: {
            laporan_ditangani: laporanDitangani,
            rata_rata_rating: parseFloat(rataRataRating.toFixed(2)),
            status: statusPelayanan,
          },
        },
        kategori_kinerja: kategoriAkhir,
      });
    }

    return evaluations;
  }
}
