import { IsEnum, IsOptional, IsArray, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftType } from '@prisma/client';

export class UpdateShiftDto {
  @ApiPropertyOptional({ enum: ShiftType, example: ShiftType.MORNING })
  @IsOptional()
  @IsEnum(ShiftType)
  shift_type?: ShiftType;

  @ApiPropertyOptional({ example: 'uuid-of-regu' })
  @IsOptional()
  @IsUUID('4')
  regu_id?: string;

  @ApiPropertyOptional({ example: ['LMS-003'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assigned_linmas_ids?: string[];
}
