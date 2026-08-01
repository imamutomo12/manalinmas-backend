import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIncidentRatingDto {
  @ApiProperty({ example: 5, description: 'Bintang 1-5' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ example: 'Petugas datang dengan sangat cepat.' })
  @IsOptional()
  @IsString()
  review?: string;
}
