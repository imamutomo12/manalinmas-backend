import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SanctionLevel } from '@prisma/client';

export class CreateViolationDto {
  @ApiProperty({ example: 'uuid-of-linmas' })
  @IsUUID('4')
  linmas_id!: string;

  @ApiProperty({ example: 'Tidur saat jaga malam' })
  @IsString()
  @IsNotEmpty()
  violation_type!: string;

  @ApiProperty({ enum: SanctionLevel, example: SanctionLevel.SP1 })
  @IsEnum(SanctionLevel)
  sanction_level!: SanctionLevel;

  @ApiProperty({ example: '2026-05-20' })
  @IsDateString()
  incident_date!: string;
}
