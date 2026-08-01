import { IsOptional, IsString, IsArray, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReguDto {
  @ApiPropertyOptional({ example: 'Regu 2 Update' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'update' })
  @IsString()
  @IsOptional()
  description?: string;

  // ---> ADD THIS NEW FIELD <---
  @ApiPropertyOptional({
    example: ['uuid-linmas-1', 'uuid-linmas-2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  linmas_ids?: string[];
}
