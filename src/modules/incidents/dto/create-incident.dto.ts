import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIncidentDto {
  @ApiProperty({ example: 'KEBAKARAN' })
  @IsString()
  @IsNotEmpty()
  incident_type!: string;

  @ApiProperty({ example: 'Rumah Pak Budi' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Api mulai membesar di dapur' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: -6.9683 })
  @Type(() => Number)
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 107.5925 })
  @Type(() => Number)
  @IsNumber()
  longitude!: number;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Foto Bukti' })
  photo: any;
}
