import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetMultipleFilesDto {
  @ApiProperty({ example: ['uuid-file-1', 'uuid-file-2'], type: [String] })
  @IsArray()
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  file_ids!: string[];
}
