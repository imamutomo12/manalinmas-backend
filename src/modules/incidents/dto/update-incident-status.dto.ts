import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IncidentStatus } from '@prisma/client';

export class UpdateIncidentStatusDto {
  @ApiProperty({
    enum: IncidentStatus,
    example: IncidentStatus.MENUNGGUPENILAIANWARGA,
  })
  @IsEnum(IncidentStatus)
  status!: IncidentStatus;

  @ApiProperty({ example: 'Pelaku melarikan diri' })
  @IsString()
  @IsNotEmpty()
  resolution_notes!: string;
}
