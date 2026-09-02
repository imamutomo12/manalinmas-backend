import { Injectable, BadRequestException } from '@nestjs/common';
import { ShiftType } from '@prisma/client';

export interface GeneratedShift {
  shift_date: string;
  shift_type: ShiftType;
  start_time: string;
  end_time: string;
  regu_id: string;
}

@Injectable()
export class ScheduleGeneratorService {
  /**
   * Pola rotasi:
   *
   * Hari 1:
   *   Siang -> Regu 1
   *   Malam -> Regu 2
   *
   * Hari 2:
   *   Siang -> Regu 3
   *   Malam -> Regu 4
   *
   * Hari 3:
   *   Siang -> Regu 2
   *   Malam -> Regu 1
   *
   * Hari 4:
   *   Siang -> Regu 4
   *   Malam -> Regu 3
   *
   * Kemudian kembali ke hari 1.
   */

  generate(
    year: number,
    month: number,
    regus: Array<{
      id: string;
      name: string;
    }>,
  ): GeneratedShift[] {
    if (regus.length !== 4) {
      throw new BadRequestException(
        'Schedule generation requires exactly 4 squads.',
      );
    }

    const reguMap = new Map(
      regus.map((regu) => [regu.name.toLowerCase(), regu.id]),
    );

    const requiredRegus = ['regu 1', 'regu 2', 'regu 3', 'regu 4'];

    for (const requiredRegu of requiredRegus) {
      if (!reguMap.has(requiredRegu)) {
        throw new BadRequestException(`${requiredRegu} tidak ditemukan.`);
      }
    }

    // month = 1..12
    const daysInMonth = new Date(year, month, 0).getDate();

    const rotation = [
      {
        morning: reguMap.get('regu 1')!,
        night: reguMap.get('regu 2')!,
      },
      {
        morning: reguMap.get('regu 3')!,
        night: reguMap.get('regu 4')!,
      },
      {
        morning: reguMap.get('regu 2')!,
        night: reguMap.get('regu 1')!,
      },
      {
        morning: reguMap.get('regu 4')!,
        night: reguMap.get('regu 3')!,
      },
    ];

    const generated: GeneratedShift[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const rotationIndex = (day - 1) % rotation.length;
      const currentRotation = rotation[rotationIndex];

      const date = `${year}-${String(month).padStart(2, '0')}-${String(
        day,
      ).padStart(2, '0')}`;

      generated.push({
        shift_date: date,
        shift_type: ShiftType.MORNING,
        start_time: '07:00:00',
        end_time: '19:00:00',
        regu_id: currentRotation.morning,
      });

      generated.push({
        shift_date: date,
        shift_type: ShiftType.NIGHT,
        start_time: '19:00:00',
        end_time: '07:00:00',
        regu_id: currentRotation.night,
      });
    }

    return generated;
  }
}
