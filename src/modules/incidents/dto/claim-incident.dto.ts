import { IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClaimIncidentDto {
  @ApiProperty({ example: 'uuid-of-linmas' })
  @IsUUID('4')
  linmas_id!: string;

  @ApiProperty({ example: '2026-05-21T20:05:00Z' })
  @IsDateString()
  claimed_at!: string;
}
