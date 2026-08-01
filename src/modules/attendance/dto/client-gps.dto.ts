import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClientGpsDto {
  @ApiProperty({ example: -6.96851 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 107.59214 })
  @IsNumber()
  longitude!: number;

  @ApiProperty({ example: 4.2 })
  @IsNumber()
  accuracy_meters!: number;
}
