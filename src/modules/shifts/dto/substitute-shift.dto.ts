import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubstituteShiftDto {
  @ApiProperty({ example: 'uuid-of-original-linmas' })
  @IsUUID('4')
  original_linmas_id!: string;

  @ApiProperty({ example: 'uuid-of-substitute-linmas' })
  @IsUUID('4')
  substitute_linmas_id!: string;

  @ApiProperty({ example: 'Sakit / Izin' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
