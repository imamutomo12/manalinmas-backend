import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReguDto {
  @ApiProperty({ example: 'Regu 1' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: '  ' })
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
