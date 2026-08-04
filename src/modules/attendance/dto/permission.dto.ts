// dto/handle-permission.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class HandlePermissionDto {
  @ApiProperty({
    description: 'ID Jadwal Shift (ShiftAssignment) yang akan diubah statusnya',
    example: 'uuid-shift-assignment-di-sini',
  })
  @IsUUID()
  @IsNotEmpty()
  shift_assignment_id!: string;

  @ApiProperty({
    description: 'Alasan izin berdasarkan konfirmasi WhatsApp',
    example: 'Sakit demam, konfirmasi via WA',
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
