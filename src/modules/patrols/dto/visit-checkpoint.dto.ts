import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class VisitCheckpointDto {
  @ApiProperty({ example: 'uuid-checkpoint-id' })
  @IsUUID('4')
  @IsNotEmpty()
  checkpoint_id!: string;

  @ApiProperty({ example: -6.90481 })
  @Type(() => Number)
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 107.61031 })
  @Type(() => Number)
  @IsNumber()
  longitude!: number;
}
