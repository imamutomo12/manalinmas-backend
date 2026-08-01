import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InterveneIncidentDto {
  @ApiProperty({ example: 'uuid-of-new-handler' })
  @IsUUID('4')
  new_handler_linmas_id!: string;

  @ApiProperty({ example: 'Handler tidak merespons' })
  @IsString()
  @IsNotEmpty()
  intervention_reason!: string;
}
