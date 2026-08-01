import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PatrolType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreatePatrolReportDto {
  @ApiProperty({ enum: PatrolType, example: PatrolType.FACILITY_DAMAGE })
  @IsEnum(PatrolType)
  patrol_type!: PatrolType;

  @ApiProperty({ example: 'Lampu jalan mati di Blok B3' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: -6.96845 })
  @Type(() => Number)
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 107.5922 })
  @Type(() => Number)
  @IsNumber()
  longitude!: number;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Foto temuan' })
  photo: any; // Untuk Swagger UI
}
