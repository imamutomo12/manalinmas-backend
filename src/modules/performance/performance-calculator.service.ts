import { Injectable } from '@nestjs/common';

@Injectable()
export class PerformanceCalculatorService {
  private readonly ATTENDANCE_WEIGHT = 0.5;
  private readonly PATROL_WEIGHT = 0.5;

  /**
   * Menghitung skor presensi:
   *
   * presensi valid / shift terjadwal × 100
   */
  calculateAttendanceScore(
    validAttendance: number,
    scheduledShifts: number,
  ): number {
    if (scheduledShifts <= 0) {
      return 0;
    }

    return this.round((validAttendance / scheduledShifts) * 100);
  }

  /**
   * Menghitung skor patroli untuk satu shift:
   *
   * checkpoint unik dikunjungi /
   * checkpoint aktif × 100
   */
  calculatePatrolShiftScore(
    uniqueVisitedCheckpoints: number,
    totalActiveCheckpoints: number,
  ): number {
    if (totalActiveCheckpoints <= 0) {
      return 0;
    }

    return this.round(
      (uniqueVisitedCheckpoints / totalActiveCheckpoints) * 100,
    );
  }

  /**
   * Menghitung rata-rata skor patroli bulanan.
   */
  calculateMonthlyPatrolScore(shiftScores: number[]): number {
    if (shiftScores.length === 0) {
      return 0;
    }

    const total = shiftScores.reduce((sum, score) => sum + score, 0);

    return this.round(total / shiftScores.length);
  }

  /**
   * Skor utama:
   *
   * Presensi × 50%
   * +
   * Patroli × 50%
   */
  calculateFinalScore(attendanceScore: number, patrolScore: number): number {
    return this.round(
      attendanceScore * this.ATTENDANCE_WEIGHT +
        patrolScore * this.PATROL_WEIGHT,
    );
  }

  /**
   * Penentuan kategori kinerja.
   */
  determineCategory(score: number): string {
    if (score >= 90) {
      return 'Sangat Baik';
    }

    if (score >= 80) {
      return 'Baik';
    }

    if (score >= 70) {
      return 'Cukup';
    }

    return 'Kurang';
  }

  /**
   * Rating pelayanan 1–5
   * dikonversi ke 0–100.
   */
  calculateServiceScore(averageRating: number): number | null {
    if (averageRating <= 0) {
      return null;
    }

    return this.round((averageRating / 5) * 100);
  }

  private round(value: number): number {
    return parseFloat(value.toFixed(2));
  }
}
