import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ClockInDto {
  @ApiProperty({ example: 'uuid-of-shift-assignment' })
  @IsUUID('4')
  @IsNotEmpty()
  shift_assignment_id!: string;

  @ApiProperty({ example: -6.90481 })
  @Type(() => Number)
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 107.610313 })
  @Type(() => Number)
  @IsNumber()
  longitude!: number;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Foto swafoto',
  })
  photo: any;
}
