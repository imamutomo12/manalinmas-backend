import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClientGpsLocationDto {
  @ApiProperty({ example: -6.9683 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 107.5925 })
  @IsNumber()
  longitude!: number;
}
