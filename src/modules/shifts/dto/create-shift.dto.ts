import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsArray,
  IsUUID,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftType } from '@prisma/client';

export class CreateShiftDto {
  @ApiProperty({ example: '2026-05-21' })
  @IsDateString()
  shift_date!: string;

  @ApiProperty({ enum: ShiftType, example: ShiftType.NIGHT })
  @IsEnum(ShiftType)
  shift_type!: ShiftType;

  @ApiPropertyOptional({
    example: 'uuid-of-regu',
    description: 'If provided, auto-assigns all members of this Regu',
  })
  @IsOptional()
  @IsUUID('4')
  regu_id?: string;
  // Make the array optional now, because they might ONLY send a regu_id
  @ApiPropertyOptional({ example: ['LMS-001', 'LMS-002'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assigned_linmas_ids?: string[];

  @ApiProperty({ example: '19:00:00', description: 'HH:MM:SS format' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'start_time must be in HH:MM:SS format',
  })
  start_time!: string;

  @ApiProperty({ example: '07:00:00', description: 'HH:MM:SS format' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'end_time must be in HH:MM:SS format',
  })
  end_time!: string;
}
